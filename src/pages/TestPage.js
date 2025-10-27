import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import API from "../services/api";
import "../styles/TestPage.css";

export default function TestPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { fullName, email } = location.state || {};

  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [currentIdx, setCurrentIdx] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [resultSaved, setResultSaved] = useState(false);
  const [testEnded, setTestEnded] = useState(false);
  const [testNotStarted, setTestNotStarted] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [timeLeft, setTimeLeft] = useState(null);

  // ✅ Step 1 — Load test control and questions
  useEffect(() => {
    if (!fullName || !email) {
      navigate("/");
      return;
    }

    const loadTest = async () => {
      console.log("🟢 Step 1: Fetching /api/testcontrol ...");
      try {
        const controlRes = await API.testcontrol.get();
        console.log("✅ Test Control Response:", controlRes.data);

        if (!controlRes?.data) {
          console.log("❌ No test control found in DB");
          setTestNotStarted(true);
          setLoading(false);
          return;
        }

        const { isActive, questionLimit, timeLimit } = controlRes.data;

        if (!isActive) {
          console.log("⚠️ Test inactive. Waiting for admin to start...");
          setTestNotStarted(true);
          setLoading(false);
          return;
        }

        console.log("🟢 Test is active. Now fetching questions...");
        const qRes = await API.questions.getAll();
        console.log("✅ Questions Response:", qRes.data);

        if (qRes.data?.error) {
          console.log("⚠️ Backend says:", qRes.data.error);
          setErrorMsg(qRes.data.error);
          setTestNotStarted(true);
          setLoading(false);
          return;
        }

        const list = Array.isArray(qRes.data.questions)
          ? qRes.data.questions
          : Array.isArray(qRes.data)
          ? qRes.data
          : [];

        console.log(`🧩 Loaded ${list.length} questions`);

        if (!list.length) {
          setErrorMsg("No questions available right now.");
        }

        setQuestions(list.slice(0, questionLimit || list.length));
        setTimeLeft((timeLimit || 30) * 60);
      } catch (err) {
        console.error("❌ Error fetching control/questions:", err);
        setErrorMsg("Could not load test. Check your backend connection.");
      } finally {
        setLoading(false);
        console.log("🟣 Finished loadTest()");
      }
    };

    loadTest();
  }, [fullName, email, navigate]);

  // ⏱ Countdown timer
  useEffect(() => {
    if (timeLeft === null) return;
    if (timeLeft <= 0) {
      alert("⏰ Time’s up! Submitting automatically...");
      handleSubmit();
      return;
    }
    const t = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
    return () => clearTimeout(t);
  }, [timeLeft]);

  // 🚫 Detect tab switch
  useEffect(() => {
    const handleTab = () => {
      if (document.hidden) setTestEnded(true);
    };
    document.addEventListener("visibilitychange", handleTab);
    return () => document.removeEventListener("visibilitychange", handleTab);
  }, []);

  const handleSelect = (id, val) => setAnswers({ ...answers, [id]: val });
  const goNext = () => currentIdx < questions.length - 1 && setCurrentIdx(currentIdx + 1);
  const goPrev = () => currentIdx > 0 && setCurrentIdx(currentIdx - 1);

  const handleSubmit = async () => {
    if (submitted) return;
    if (Object.keys(answers).length < questions.length) {
      if (!window.confirm("Some questions are unanswered. Submit anyway?")) return;
    }

    let s = 0;
    questions.forEach((q) => {
      if (q.questionType === "MCQ" && answers[q._id] === q.correctAnswer) s++;
    });
    setScore(s);
    setSubmitted(true);

    const formatted = questions.map((q) => ({
      question: q.questionText,
      userAnswer: answers[q._id] || "Not answered",
      correctAnswer: q.correctAnswer || "",
      isCorrect: q.questionType === "MCQ" ? answers[q._id] === q.correctAnswer : null,
      type: q.questionType,
    }));

    try {
      await API.tests.submit({
        name: fullName,
        email,
        answers: formatted,
        totalQuestions: questions.length,
        correctAnswers: s,
        scorePercent: ((s / questions.length) * 100).toFixed(2),
      });
      setResultSaved(true);
    } catch (err) {
      console.error("❌ Error saving result:", err);
      alert("Failed to save result to server.");
    }
  };

  // ⚠️ If user switched tab
  if (testEnded)
    return (
      <div className="container container-center text-center">
        <h3 className="text-danger">⚠️ Test Ended</h3>
        <p>You switched tabs or reloaded.</p>
        <button className="btn btn-primary mt-3" onClick={() => navigate("/")}>
          Go Home
        </button>
      </div>
    );

  // ⚠️ Test Not Started
  if (testNotStarted)
    return (
      <div className="container container-center text-center">
        <h3 className="text-warning">⚠️ Test Not Active</h3>
        <p>Waiting for admin to start the test...</p>
        <button className="btn btn-primary mt-3" onClick={() => navigate("/")}>
          Back to Home
        </button>
      </div>
    );

  // ❌ Error
  if (errorMsg)
    return (
      <div className="container container-center text-center">
        <h3 className="text-danger">❌ Error</h3>
        <p>{errorMsg}</p>
      </div>
    );

  // ⏳ Loading
  if (loading)
    return (
      <div className="container container-center text-center">
        <h5>Loading questions…</h5>
      </div>
    );

  if (!questions.length)
    return (
      <div className="container container-center text-center">
        <p>No questions available.</p>
      </div>
    );

    // ✅ After submitting show thank-you message
if (submitted && resultSaved) {
  return (
    <div className="container container-center text-center">
      <div className="card card-clean p-4">
        <h3 className="text-success">🎉 Thank You for Completing the Test!</h3>
        <p>
          <strong>{fullName}</strong> ({email})
        </p>
        <p>Your responses have been recorded successfully.</p>
        <button
          className="btn btn-primary mt-3"
          onClick={() => navigate("/")}
        >
          Go to Home
        </button>
      </div>
    </div>
  );
}

  // ✅ Main Test View
  const currentQ = questions[currentIdx];
  const selectedAnswer = answers[currentQ._id] || "";

  return (
    <div className="test-container">
      <div className="card test-card">
        <div className="test-header d-flex justify-content-between align-items-center">
          <div>
            <h5 className="text-danger fw-bold">Candidate: {fullName}</h5>
            <small>{email}</small>
          </div>
          <div>
            <span className="badge bg-primary me-2">
              Q {currentIdx + 1}/{questions.length}
            </span>
            <span className="badge bg-danger">
              ⏳ {Math.floor(timeLeft / 60)}:
              {(timeLeft % 60).toString().padStart(2, "0")}
            </span>
          </div>
        </div>

        <div className="test-body">
          <h6>
            <b>Q{currentIdx + 1}:</b> {currentQ.questionText}
          </h6>

          {currentQ.questionType === "MCQ" ? (
            <div className="options-container">
              {currentQ.options.map((opt, i) => (
                <label key={i} className={`option-item ${selectedAnswer === opt ? "selected" : ""}`}>
                  <input
                    type="radio"
                    name={`question-${currentQ._id}`}
                    value={opt}
                    checked={selectedAnswer === opt}
                    onChange={(e) => handleSelect(currentQ._id, e.target.value)}
                  />
                  {opt}
                </label>
              ))}
            </div>
          ) : (
            <textarea
              className="theory-input"
              placeholder="Type your answer..."
              value={selectedAnswer}
              onChange={(e) => handleSelect(currentQ._id, e.target.value)}
              rows={5}
            />
          )}
        </div>

        <div className="test-footer d-flex justify-content-between">
          <div>
            <button className="btn btn-secondary me-2" disabled={currentIdx === 0} onClick={goPrev}>
              Previous
            </button>
            <button
              className="btn btn-secondary"
              disabled={currentIdx === questions.length - 1}
              onClick={goNext}
            >
              Next
            </button>
          </div>
          <button className="btn btn-success" onClick={handleSubmit}>
            Submit Test
          </button>
        </div>
      </div>
    </div>
  );
}

// import React, { useEffect, useState } from "react";
// import { useLocation, useNavigate } from "react-router-dom";
// import API from "../services/api";
// import "../styles/TestPage.css";

// export default function TestPage() {
//   const location = useLocation();
//   const navigate = useNavigate();
//   const { fullName, email } = location.state || {};

//   const [questions, setQuestions] = useState([]);
//   const [answers, setAnswers] = useState({});
//   const [currentIdx, setCurrentIdx] = useState(0);
//   const [loading, setLoading] = useState(true);
//   const [submitted, setSubmitted] = useState(false);
//   const [score, setScore] = useState(0);
//   const [resultSaved, setResultSaved] = useState(false);
//   const [testEnded, setTestEnded] = useState(false);
//   const [testNotStarted, setTestNotStarted] = useState(false);
//   const [errorMsg, setErrorMsg] = useState("");
//   const [timeLeft, setTimeLeft] = useState(null);

//   // 🧩 Step 1: Load test control → questions
//   useEffect(() => {
//     if (!fullName || !email) {
//       navigate("/");
//       return;
//     }

//     const loadTest = async () => {
//       console.log("🟢 Loading test control...");
//       try {
//         const controlRes = await API.testcontrol.get();
//         console.log("✅ Test control response:", controlRes.data);

//         if (!controlRes?.data) {
//           console.log("❌ No control data found");
//           setTestNotStarted(true);
//           setLoading(false);
//           return;
//         }

//         const { isActive, questionLimit, timeLimit } = controlRes.data;

//         if (!isActive) {
//           console.log("⚠️ Test is inactive (waiting for admin)");
//           setTestNotStarted(true);
//           setLoading(false);
//           return;
//         }

//         console.log("🟢 Test is active, fetching questions...");
//         const qRes = await API.questions.getAll();
//         console.log("✅ Questions response:", qRes.data);

//         if (qRes.data?.error) {
//           console.log("⚠️ Backend says:", qRes.data.error);
//           setTestNotStarted(true);
//           setLoading(false);
//           return;
//         }

//         const questionsList = Array.isArray(qRes.data.questions)
//           ? qRes.data.questions
//           : Array.isArray(qRes.data)
//           ? qRes.data
//           : [];

//         console.log("🧩 Questions loaded:", questionsList.length);

//         if (!questionsList.length) {
//           setErrorMsg("No questions found. Contact admin.");
//         }

//         setQuestions(questionsList.slice(0, questionLimit || questionsList.length));
//         setTimeLeft((timeLimit || 30) * 60);
//       } catch (err) {
//         console.error("❌ Error during loadTest():", err);
//         setErrorMsg("Failed to fetch test details.");
//       } finally {
//         console.log("🟣 Finished loading test data");
//         setLoading(false);
//       }
//     };

//     loadTest();
//   }, [fullName, email, navigate]);

//   // 🕒 Countdown
//   useEffect(() => {
//     if (timeLeft === null) return;
//     if (timeLeft <= 0) {
//       alert("⏰ Time’s up! Submitting automatically.");
//       handleSubmit();
//       return;
//     }
//     const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
//     return () => clearTimeout(timer);
//   }, [timeLeft]);

//   // 🚫 Prevent tab switch
//   useEffect(() => {
//     const handleVisibility = () => {
//       if (document.hidden) setTestEnded(true);
//     };
//     document.addEventListener("visibilitychange", handleVisibility);
//     return () => document.removeEventListener("visibilitychange", handleVisibility);
//   }, []);

//   const handleSelect = (id, value) => {
//     setAnswers({ ...answers, [id]: value });
//   };

//   const goNext = () => currentIdx < questions.length - 1 && setCurrentIdx(currentIdx + 1);
//   const goPrev = () => currentIdx > 0 && setCurrentIdx(currentIdx - 1);

//   const handleSubmit = async () => {
//     if (submitted) return;
//     if (Object.keys(answers).length < questions.length) {
//       if (!window.confirm("Some questions are unanswered. Submit anyway?")) return;
//     }

//     let s = 0;
//     questions.forEach((q) => {
//       if (q.questionType === "MCQ" && answers[q._id] === q.correctAnswer) s++;
//     });
//     setScore(s);
//     setSubmitted(true);

//     const formatted = questions.map((q) => ({
//       question: q.questionText,
//       userAnswer: answers[q._id] || "Not answered",
//       correctAnswer: q.correctAnswer || "",
//       isCorrect: q.questionType === "MCQ" ? answers[q._id] === q.correctAnswer : null,
//       type: q.questionType,
//     }));

//     try {
//       await API.tests.submit({
//         name: fullName,
//         email,
//         answers: formatted,
//         totalQuestions: questions.length,
//         correctAnswers: s,
//         scorePercent: ((s / questions.length) * 100).toFixed(2),
//       });
//       setResultSaved(true);
//     } catch (err) {
//       console.error("Error saving result:", err);
//       alert("Failed to save result to server.");
//     }
//   };

//   // ⚠️ Test Ended
//   if (testEnded)
//     return (
//       <div className="container container-center text-center">
//         <h3 className="text-danger">⚠️ Test Ended</h3>
//         <p>You left or reloaded the page.</p>
//         <button className="btn btn-primary mt-3" onClick={() => navigate("/")}>
//           Go Home
//         </button>
//       </div>
//     );

//   // ⚠️ Test Not Started
//   if (testNotStarted)
//     return (
//       <div className="container container-center text-center">
//         <h3 className="text-warning">⚠️ Test Not Active</h3>
//         <p>Waiting for admin to start the test.</p>
//         <button className="btn btn-primary mt-3" onClick={() => navigate("/")}>
//           Back to Home
//         </button>
//       </div>
//     );

//   // ❌ Error state
//   if (errorMsg)
//     return (
//       <div className="container container-center text-center">
//         <h3 className="text-danger">❌ Error</h3>
//         <p>{errorMsg}</p>
//         <button className="btn btn-primary mt-3" onClick={() => navigate("/")}>
//           Go to Home
//         </button>
//       </div>
//     );

//   // ⏳ Loading
//   if (loading)
//     return (
//       <div className="container container-center text-center">
//         <h5>Loading questions…</h5>
//       </div>
//     );

//   if (!questions.length)
//     return (
//       <div className="container container-center text-center">
//         <p>No questions available.</p>
//       </div>
//     );

//   // ✅ Active Test Screen
//   const currentQ = questions[currentIdx];
//   const selectedAnswer = answers[currentQ._id] || "";

//   return (
//     <div className="test-container">
//       <div className="card test-card">
//         <div className="test-header d-flex justify-content-between align-items-center">
//           <div>
//             <h5 className="text-danger fw-bold">Candidate: {fullName}</h5>
//             <small>{email}</small>
//           </div>
//           <div>
//             <span className="badge bg-primary me-2">
//               Q {currentIdx + 1}/{questions.length}
//             </span>
//             <span className="badge bg-danger">
//               ⏳ {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, "0")}
//             </span>
//           </div>
//         </div>

//         <div className="test-body">
//           <h6>
//             <b>Q{currentIdx + 1}:</b> {currentQ.questionText}
//           </h6>

//           {currentQ.questionType === "MCQ" ? (
//             <div className="options-container">
//               {currentQ.options.map((opt, i) => (
//                 <label
//                   key={i}
//                   className={`option-item ${selectedAnswer === opt ? "selected" : ""}`}
//                 >
//                   <input
//                     type="radio"
//                     name={`question-${currentQ._id}`}
//                     value={opt}
//                     checked={selectedAnswer === opt}
//                     onChange={(e) => handleSelect(currentQ._id, e.target.value)}
//                   />
//                   {opt}
//                 </label>
//               ))}
//             </div>
//           ) : (
//             <textarea
//               className="theory-input"
//               placeholder="Type your answer here..."
//               value={selectedAnswer}
//               onChange={(e) => handleSelect(currentQ._id, e.target.value)}
//               rows={5}
//             />
//           )}
//         </div>

//         <div className="test-footer d-flex justify-content-between">
//           <div>
//             <button className="btn btn-secondary me-2" disabled={currentIdx === 0} onClick={goPrev}>
//               Previous
//             </button>
//             <button
//               className="btn btn-secondary"
//               disabled={currentIdx === questions.length - 1}
//               onClick={goNext}
//             >
//               Next
//             </button>
//           </div>
//           <button className="btn btn-success" onClick={handleSubmit}>
//             Submit Test
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// }

// // import React, { useEffect, useState } from "react";
// // import { useLocation, useNavigate } from "react-router-dom";
// // import API from "../services/api";
// // import "../styles/TestPage.css";

// // export default function TestPage() {
// //   const location = useLocation();
// //   const navigate = useNavigate();
// //   const { fullName, email } = location.state || {};

// //   const [questions, setQuestions] = useState([]);
// //   const [answers, setAnswers] = useState({});
// //   const [currentIdx, setCurrentIdx] = useState(0);
// //   const [loading, setLoading] = useState(true);
// //   const [submitted, setSubmitted] = useState(false);
// //   const [score, setScore] = useState(0);
// //   const [resultSaved, setResultSaved] = useState(false);
// //   const [testEnded, setTestEnded] = useState(false);
// //   const [testNotStarted, setTestNotStarted] = useState(false);
// //   const [timeLeft, setTimeLeft] = useState(null);

// //   // 🟢 Fetch test control and questions only when test is active
// //   useEffect(() => {
// //     if (!fullName || !email) {
// //       navigate("/");
// //       return;
// //     }

// //     const initTest = async () => {
// //       try {
// //         // 1️⃣ Fetch test control first
// //         const controlRes = await API.testcontrol.get();
// //         const control = controlRes.data;

// //         if (!control || !control.isActive) {
// //           setTestNotStarted(true);
// //           setLoading(false);
// //           return;
// //         }

// //         // 2️⃣ Fetch all questions
// //         const questionRes = await API.questions.getAll();
// //         const allQuestions = Array.isArray(questionRes.data)
// //           ? questionRes.data
// //           : [];

// //         // 3️⃣ Limit number of questions from admin config
// //         const limitedQuestions = allQuestions.slice(0, control.questionLimit || allQuestions.length);

// //         setQuestions(limitedQuestions);
// //         setTimeLeft((control.timeLimit || 10) * 60); // Convert minutes to seconds
// //       } catch (err) {
// //         console.error("❌ Error initializing test:", err);
// //         setTestNotStarted(true);
// //       } finally {
// //         setLoading(false);
// //       }
// //     };

// //     initTest();
// //   }, [fullName, email, navigate]);

// //   // 🕒 Countdown timer
// //   useEffect(() => {
// //     if (timeLeft === null) return;
// //     if (timeLeft <= 0) {
// //       alert("⏰ Time’s up! Submitting your test automatically.");
// //       handleSubmit();
// //       return;
// //     }

// //     const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
// //     return () => clearTimeout(timer);
// //   }, [timeLeft]);

// //   // 🛑 Detect tab switch, reload, or page exit
// //   useEffect(() => {
// //     const handleBeforeUnload = (e) => {
// //       e.preventDefault();
// //       e.returnValue = "";
// //       setTestEnded(true);
// //     };

// //     const handleVisibilityChange = () => {
// //       if (document.hidden) {
// //         setTestEnded(true);
// //       }
// //     };

// //     window.addEventListener("beforeunload", handleBeforeUnload);
// //     document.addEventListener("visibilitychange", handleVisibilityChange);

// //     return () => {
// //       window.removeEventListener("beforeunload", handleBeforeUnload);
// //       document.removeEventListener("visibilitychange", handleVisibilityChange);
// //     };
// //   }, []);

// //   const handleSelect = (questionId, value) => {
// //     setAnswers({ ...answers, [questionId]: value });
// //   };

// //   const goNext = () => {
// //     if (currentIdx < questions.length - 1) setCurrentIdx(currentIdx + 1);
// //   };
// //   const goPrev = () => {
// //     if (currentIdx > 0) setCurrentIdx(currentIdx - 1);
// //   };

// //   const handleSubmit = async () => {
// //     if (submitted) return;
// //     if (Object.keys(answers).length < questions.length) {
// //       if (!window.confirm("Some questions are unanswered. Submit anyway?")) return;
// //     }

// //     let s = 0;
// //     questions.forEach((q) => {
// //       if (q.questionType === "MCQ" && answers[q._id] === q.correctAnswer) s += 1;
// //     });
// //     setScore(s);
// //     setSubmitted(true);

// //     const formattedAnswers = questions.map((q) => ({
// //       question: q.questionText,
// //       userAnswer: answers[q._id] || "Not answered",
// //       correctAnswer: q.correctAnswer || "",
// //       isCorrect: q.questionType === "MCQ" ? answers[q._id] === q.correctAnswer : null,
// //       type: q.questionType || "Theory",
// //     }));

// //     try {
// //       await API.tests.submit({
// //         name: fullName,
// //         email,
// //         answers: formattedAnswers,
// //         totalQuestions: questions.length,
// //         correctAnswers: s,
// //         scorePercent: ((s / questions.length) * 100).toFixed(2),
// //       });
// //       setResultSaved(true);
// //     } catch (err) {
// //       console.error("Error saving result:", err);
// //       alert("Failed to save result to server.");
// //     }
// //   };

// //   // 🛑 If user switched tab or reloaded
// //   if (testEnded) {
// //     return (
// //       <div className="container container-center">
// //         <div className="card card-clean p-4 text-center">
// //           <h3 className="text-danger">⚠️ Test Ended</h3>
// //           <p>Your session ended because you switched tabs or reloaded.</p>
// //           <button className="btn btn-primary mt-3" onClick={() => navigate("/")}>
// //             Go to Home
// //           </button>
// //         </div>
// //       </div>
// //     );
// //   }

// //   // 🛑 If test not started
// //   if (testNotStarted) {
// //     return (
// //       <div className="container container-center">
// //         <div className="card card-clean p-4 text-center">
// //           <h3 className="text-warning">⚠️ Test Not Active</h3>
// //           <p>The test has not been started by admin yet.</p>
// //           <button className="btn btn-primary mt-3" onClick={() => navigate("/")}>
// //             Back to Home
// //           </button>
// //         </div>
// //       </div>
// //     );
// //   }

// //   // 🟢 Loading
// //   if (loading)
// //     return <div className="container container-center">Loading questions…</div>;

// //   if (!questions || questions.length === 0)
// //     return <div className="container container-center">No questions available.</div>;

// //   // 🟢 After submit
// //   if (submitted) {
// //     return (
// //       <div className="container container-center">
// //         <div className="card card-clean p-4">
// //           <h3 className="text-success">✅ Test Completed</h3>
// //           <p>
// //             <strong>{fullName}</strong> ({email})
// //           </p>
// //           <h4>
// //             Your Score: {score} / {questions.length}
// //           </h4>

// //           {resultSaved && (
// //             <div className="alert alert-success mt-2">
// //               ✅ Your result has been recorded successfully!
// //             </div>
// //           )}

// //           <hr />
// //           <h5>Review Answers</h5>
// //           <div>
// //             {questions.map((q, idx) => (
// //               <div className="review-question" key={q._id}>
// //                 <b>Q{idx + 1}:</b> {q.questionText}
// //                 <div>
// //                   Your answer:{" "}
// //                   <span
// //                     className={
// //                       q.questionType === "MCQ"
// //                         ? answers[q._id] === q.correctAnswer
// //                           ? "text-success"
// //                           : "text-danger"
// //                         : "text-primary"
// //                     }
// //                   >
// //                     {answers[q._id] || "Not answered"}
// //                   </span>
// //                 </div>
// //                 {q.questionType === "MCQ" && (
// //                   <div>
// //                     Correct answer:{" "}
// //                     <span className="text-success">{q.correctAnswer}</span>
// //                   </div>
// //                 )}
// //               </div>
// //             ))}
// //           </div>

// //           <div className="mt-4">
// //             <button className="btn btn-primary me-2" onClick={() => navigate("/")}>
// //               Back to Home
// //             </button>
// //             <button
// //               className="btn btn-outline-secondary"
// //               onClick={() => window.location.reload()}
// //             >
// //               Retake Test
// //             </button>
// //           </div>
// //         </div>
// //       </div>
// //     );
// //   }

// //   // 🟢 Active test page
// //   const currentQ = questions[currentIdx];
// //   const selectedAnswer = answers[currentQ._id] || "";

// //   return (
// //     <div className="test-container">
// //       <div className="card test-card">
// //         <div className="test-header">
// //           <div>
// //             <h5 className="text-danger fw-bold">Candidate: {fullName}</h5>
// //             <small className="text-muted">{email}</small>
// //           </div>
// //           <div>
// //             <span className="badge bg-primary me-2">
// //               Question {currentIdx + 1} / {questions.length}
// //             </span>
// //             <span className="badge bg-danger">
// //               ⏳ {Math.floor(timeLeft / 60)}:
// //               {(timeLeft % 60).toString().padStart(2, "0")}
// //             </span>
// //           </div>
// //         </div>

// //         <div className="test-body">
// //           <h6 className="question-text">
// //             <b>Q{currentIdx + 1}:</b> {currentQ.questionText}
// //           </h6>

// //           {currentQ.questionType === "MCQ" && currentQ.options?.length > 0 ? (
// //             <div className="options-container">
// //               {currentQ.options.map((opt, i) => (
// //                 <label
// //                   key={i}
// //                   className={`option-item ${
// //                     selectedAnswer === opt ? "selected" : ""
// //                   }`}
// //                 >
// //                   <input
// //                     type="radio"
// //                     name={`question-${currentQ._id}`}
// //                     value={opt}
// //                     checked={selectedAnswer === opt}
// //                     onChange={(e) => handleSelect(currentQ._id, e.target.value)}
// //                   />
// //                   {opt}
// //                 </label>
// //               ))}
// //             </div>
// //           ) : (
// //             <textarea
// //               className="theory-input"
// //               placeholder="Type your answer here..."
// //               value={selectedAnswer}
// //               onChange={(e) => handleSelect(currentQ._id, e.target.value)}
// //               rows={5}
// //             ></textarea>
// //           )}
// //         </div>

// //         <div className="test-footer">
// //           <div>
// //             <button
// //               className="btn btn-secondary me-3"
// //               onClick={goPrev}
// //               disabled={currentIdx === 0}
// //             >
// //               Previous
// //             </button>
// //             <button
// //               className="btn btn-secondary"
// //               onClick={goNext}
// //               disabled={currentIdx === questions.length - 1}
// //             >
// //               Next
// //             </button>
// //           </div>

// //           <div>
// //             <button className="btn btn-success" onClick={handleSubmit}>
// //               Submit Test
// //             </button>
// //           </div>
// //         </div>
// //       </div>
// //     </div>
// //   );
// // }

// // // import React, { useEffect, useState } from "react";
// // // import { useLocation, useNavigate } from "react-router-dom";
// // // import API from "../services/api";
// // // import "../styles/TestPage.css";

// // // export default function TestPage() {
// // //   const location = useLocation();
// // //   const navigate = useNavigate();
// // //   const { fullName, email } = location.state || {};

// // //   const [questions, setQuestions] = useState([]);
// // //   const [answers, setAnswers] = useState({});
// // //   const [currentIdx, setCurrentIdx] = useState(0);
// // //   const [loading, setLoading] = useState(true);
// // //   const [submitted, setSubmitted] = useState(false);
// // //   const [score, setScore] = useState(0);
// // //   const [resultSaved, setResultSaved] = useState(false);
// // //   const [testEnded, setTestEnded] = useState(false);
// // //   const [testNotStarted, setTestNotStarted] = useState(false);
// // //   const [timeLeft, setTimeLeft] = useState(null);

// // //   // 🟢 Fetch questions only when test is active
// // //   useEffect(() => {
// // //     if (!fullName || !email) {
// // //       navigate("/");
// // //       return;
// // //     }

// // //     const fetchQuestions = async () => {
// // //       try {
// // //         const res = await API.questions.getAll();

// // //         // 🛑 If test is not active
// // //         if (res.data?.error || !res.data?.isActive) {
// // //           setTestNotStarted(true);
// // //           setLoading(false);
// // //           return;
// // //         }

// // //         const questionsArray = Array.isArray(res.data)
// // //           ? res.data
// // //           : res.data.questions || [];

// // //         setQuestions(questionsArray);
// // //         setTimeLeft((res.data.timeLimit || 10) * 60); // Convert minutes → seconds
// // //       } catch (err) {
// // //         console.error(err);
// // //         alert("Failed to fetch questions. Please wait for admin to start the test.");
// // //         setTestNotStarted(true);
// // //       } finally {
// // //         setLoading(false);
// // //       }
// // //     };

// // //     fetchQuestions();
// // //   }, [fullName, email, navigate]);

// // //   // 🕒 Countdown timer
// // //   useEffect(() => {
// // //     if (timeLeft === null) return;
// // //     if (timeLeft <= 0) {
// // //       alert("⏰ Time’s up! Submitting your test automatically.");
// // //       handleSubmit();
// // //       return;
// // //     }

// // //     const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
// // //     return () => clearTimeout(timer);
// // //   }, [timeLeft]);

// // //   // 🛑 Detect tab switch, reload, or page exit
// // //   useEffect(() => {
// // //     const handleBeforeUnload = (e) => {
// // //       e.preventDefault();
// // //       e.returnValue = "";
// // //       setTestEnded(true);
// // //     };

// // //     const handleVisibilityChange = () => {
// // //       if (document.hidden) {
// // //         setTestEnded(true);
// // //       }
// // //     };

// // //     window.addEventListener("beforeunload", handleBeforeUnload);
// // //     document.addEventListener("visibilitychange", handleVisibilityChange);

// // //     return () => {
// // //       window.removeEventListener("beforeunload", handleBeforeUnload);
// // //       document.removeEventListener("visibilitychange", handleVisibilityChange);
// // //     };
// // //   }, []);

// // //   // 🟢 Select answer
// // //   const handleSelect = (questionId, value) => {
// // //     setAnswers({ ...answers, [questionId]: value });
// // //   };

// // //   // 🟢 Navigation
// // //   const goNext = () => {
// // //     if (currentIdx < questions.length - 1) setCurrentIdx(currentIdx + 1);
// // //   };
// // //   const goPrev = () => {
// // //     if (currentIdx > 0) setCurrentIdx(currentIdx - 1);
// // //   };

// // //   // 🟢 Submit handler
// // //   const handleSubmit = async () => {
// // //     if (submitted) return; // Prevent multiple submits
// // //     if (Object.keys(answers).length < questions.length) {
// // //       if (!window.confirm("Some questions are unanswered. Submit anyway?")) return;
// // //     }

// // //     // Calculate score (for MCQs only)
// // //     let s = 0;
// // //     questions.forEach((q) => {
// // //       if (q.questionType === "MCQ" && answers[q._id] === q.correctAnswer) s += 1;
// // //     });

// // //     setScore(s);
// // //     setSubmitted(true);

// // //     const formattedAnswers = questions.map((q) => ({
// // //       question: q.questionText,
// // //       userAnswer: answers[q._id] || "Not answered",
// // //       correctAnswer: q.correctAnswer || "",
// // //       isCorrect: q.questionType === "MCQ" ? answers[q._id] === q.correctAnswer : null,
// // //       type: q.questionType || "Theory",
// // //     }));

// // //     try {
// // //       await API.tests.submit({
// // //         name: fullName,
// // //         email,
// // //         answers: formattedAnswers,
// // //         totalQuestions: questions.length,
// // //         correctAnswers: s,
// // //         scorePercent: ((s / questions.length) * 100).toFixed(2),
// // //       });
// // //       setResultSaved(true);
// // //     } catch (err) {
// // //       console.error("Error saving result:", err);
// // //       alert("Failed to save result to server.");
// // //     }
// // //   };

// // //   // 🛑 If user switched tab or reloaded
// // //   if (testEnded) {
// // //     return (
// // //       <div className="container container-center">
// // //         <div className="card card-clean p-4 text-center">
// // //           <h3 className="text-danger">⚠️ Test Ended</h3>
// // //           <p>Your session ended because you switched tabs, reloaded, or left the page.</p>
// // //           <h4 className="mt-3 text-success">Thank you for your time!</h4>
// // //           <button className="btn btn-primary mt-3" onClick={() => navigate("/")}>
// // //             Go to Home
// // //           </button>
// // //         </div>
// // //       </div>
// // //     );
// // //   }

// // //   // 🛑 If test not started
// // //   if (testNotStarted) {
// // //     return (
// // //       <div className="container container-center">
// // //         <div className="card card-clean p-4 text-center">
// // //           <h3 className="text-warning">⚠️ Test Not Active</h3>
// // //           <p>The test has not been started by admin yet.</p>
// // //           <h5 className="mt-2">Please contact the administrator to begin your test.</h5>
// // //           <button className="btn btn-primary mt-3" onClick={() => navigate("/")}>
// // //             Back to Home
// // //           </button>
// // //         </div>
// // //       </div>
// // //     );
// // //   }

// // //   // 🟢 Loading
// // //   if (loading) return <div className="container container-center">Loading questions…</div>;
// // //   if (!questions || questions.length === 0)
// // //     return <div className="container container-center">No questions available. Please try later.</div>;

// // //   // 🟢 After submit (Review screen)
// // //   if (submitted) {
// // //     return (
// // //       <div className="container container-center">
// // //         <div className="card card-clean p-4">
// // //           <h3 className="text-success">Test Completed Successfully</h3>
// // //           <p>
// // //             <strong>{fullName}</strong> ({email})
// // //           </p>
// // //           <h4>
// // //             Your Score: {score} / {questions.length}
// // //           </h4>

// // //           {resultSaved && (
// // //             <div className="alert alert-success mt-2">
// // //               ✅ Your result has been recorded successfully!
// // //             </div>
// // //           )}

// // //           <hr />
// // //           <h5>Review Answers</h5>
// // //           <div>
// // //             {questions.map((q, idx) => (
// // //               <div className="review-question" key={q._id}>
// // //                 <b>Q{idx + 1}:</b> {q.questionText}
// // //                 <div>
// // //                   Your answer:{" "}
// // //                   <span
// // //                     className={
// // //                       q.questionType === "MCQ"
// // //                         ? answers[q._id] === q.correctAnswer
// // //                           ? "text-success"
// // //                           : "text-danger"
// // //                         : "text-primary"
// // //                     }
// // //                   >
// // //                     {answers[q._id] || "Not answered"}
// // //                   </span>
// // //                 </div>
// // //                 {q.questionType === "MCQ" && (
// // //                   <div>
// // //                     Correct answer:{" "}
// // //                     <span className="text-success">{q.correctAnswer}</span>
// // //                   </div>
// // //                 )}
// // //               </div>
// // //             ))}
// // //           </div>

// // //           <div className="mt-4">
// // //             <button className="btn btn-primary me-2" onClick={() => navigate("/")}>
// // //               Back to Home
// // //             </button>
// // //             <button className="btn btn-outline-secondary" onClick={() => window.location.reload()}>
// // //               Retake Test
// // //             </button>
// // //           </div>
// // //         </div>
// // //       </div>
// // //     );
// // //   }

// // //   // 🟢 Active test page
// // //   const currentQ = questions[currentIdx];
// // //   const selectedAnswer = answers[currentQ._id] || "";

// // //   return (
// // //     <div className="test-container">
// // //       <div className="card test-card">
// // //         <div className="test-header">
// // //           <div>
// // //             <h5 className="text-danger fw-bold">Candidate: {fullName}</h5>
// // //             <small className="text-muted">{email}</small>
// // //           </div>
// // //           <div>
// // //             <span className="badge bg-primary me-2">
// // //               Question {currentIdx + 1} / {questions.length}
// // //             </span>
// // //             <span className="badge bg-danger">
// // //               ⏳ {Math.floor(timeLeft / 60)}:
// // //               {(timeLeft % 60).toString().padStart(2, "0")}
// // //             </span>
// // //           </div>
// // //         </div>

// // //         <div className="test-body">
// // //           <h6 className="question-text">
// // //             <b>Q{currentIdx + 1}:</b> {currentQ.questionText}
// // //           </h6>

// // //           {currentQ.questionType === "MCQ" && currentQ.options?.length > 0 ? (
// // //             <div className="options-container">
// // //               {currentQ.options.map((opt, i) => (
// // //                 <label
// // //                   key={i}
// // //                   className={`option-item ${
// // //                     selectedAnswer === opt ? "selected" : ""
// // //                   }`}
// // //                 >
// // //                   <input
// // //                     type="radio"
// // //                     name={`question-${currentQ._id}`}
// // //                     value={opt}
// // //                     checked={selectedAnswer === opt}
// // //                     onChange={(e) => handleSelect(currentQ._id, e.target.value)}
// // //                   />
// // //                   {opt}
// // //                 </label>
// // //               ))}
// // //             </div>
// // //           ) : (
// // //             <textarea
// // //               className="theory-input"
// // //               placeholder="Type your answer here..."
// // //               value={selectedAnswer}
// // //               onChange={(e) => handleSelect(currentQ._id, e.target.value)}
// // //               rows={5}
// // //             ></textarea>
// // //           )}
// // //         </div>

// // //         <div className="test-footer">
// // //           <div>
// // //             <button
// // //               className="btn btn-secondary me-3"
// // //               onClick={goPrev}
// // //               disabled={currentIdx === 0}
// // //             >
// // //               Previous
// // //             </button>
// // //             <button
// // //               className="btn btn-secondary"
// // //               onClick={goNext}
// // //               disabled={currentIdx === questions.length - 1}
// // //             >
// // //               Next
// // //             </button>
// // //           </div>

// // //           <div>
// // //             <button className="btn btn-success" onClick={handleSubmit}>
// // //               Submit Test
// // //             </button>
// // //           </div>
// // //         </div>
// // //       </div>
// // //     </div>
// // //   );
// // // }


// // // import React, { useEffect, useState } from "react";
// // // import { useLocation, useNavigate } from "react-router-dom";
// // // import API from "../services/api";
// // // import "../styles/TestPage.css";


// // // function pickRandom(arr, n) {
// // //   const copy = [...arr];
// // //   const res = [];
// // //   while (res.length < n && copy.length > 0) {
// // //     const idx = Math.floor(Math.random() * copy.length);
// // //     res.push(copy.splice(idx, 1)[0]);
// // //   }
// // //   return res;
// // // }

// // // export default function TestPage() {
// // //   const location = useLocation();
// // //   const navigate = useNavigate();
// // //   const { fullName, email, numQ } = location.state || {};

// // //   const [allQuestions, setAllQuestions] = useState([]);
// // //   const [questions, setQuestions] = useState([]);
// // //   const [answers, setAnswers] = useState({});
// // //   const [currentIdx, setCurrentIdx] = useState(0);
// // //   const [loading, setLoading] = useState(true);
// // //   const [submitted, setSubmitted] = useState(false);
// // //   const [score, setScore] = useState(0);
// // //   const [resultSaved, setResultSaved] = useState(false);
// // //   const [testEnded, setTestEnded] = useState(false); // 🆕 detect tab switch/reload
// // //   const [timeLeft, setTimeLeft] = useState(null);

// // //   // 🟢 Fetch questions
// // //   useEffect(() => {
// // //     if (!fullName || !email) {
// // //       navigate("/");
// // //       return;
// // //     }

// // //     const fetchQuestions = async () => {
// // //   try {
// // //     const res = await API.questions.getAll();
// // //     if (res.data.error) {
// // //       alert(res.data.error);
// // //       navigate("/");
// // //       return;
// // //     }

// // //     setQuestions(res.data.questions || []);
// // //     setTimeLeft(res.data.timeLimit * 60); // seconds
// // //   } catch (err) {
// // //     console.error(err);
// // //     alert("Failed to fetch questions. Please wait for admin to start the test.");
// // //     navigate("/");
// // //   } finally {
// // //     setLoading(false);
// // //   }
// // // };


// // //     fetchQuestions();
// // //   }, [fullName, email, navigate]);

// // //   // 🟢 Pick random questions
// // //   useEffect(() => {
// // //     if (!loading && allQuestions.length > 0) {
// // //       const selected = pickRandom(allQuestions, Math.min(numQ || 10, allQuestions.length));
// // //       setQuestions(selected);
// // //     }
// // //   }, [loading, allQuestions, numQ]);

// // //   // 🛑 Detect tab switch, reload, or page exit
// // //   useEffect(() => {
// // //     const handleBeforeUnload = (e) => {
// // //       e.preventDefault();
// // //       e.returnValue = "";
// // //       setTestEnded(true);
// // //     };

// // //     const handleVisibilityChange = () => {
// // //       if (document.hidden) {
// // //         setTestEnded(true);
// // //       }
// // //     };

// // //     window.addEventListener("beforeunload", handleBeforeUnload);
// // //     document.addEventListener("visibilitychange", handleVisibilityChange);

// // //     return () => {
// // //       window.removeEventListener("beforeunload", handleBeforeUnload);
// // //       document.removeEventListener("visibilitychange", handleVisibilityChange);
// // //     };
// // //   }, []);

// // //   const handleSelect = (questionId, value) => {
// // //     setAnswers({ ...answers, [questionId]: value });
// // //   };

// // //   const goNext = () => {
// // //     if (currentIdx < questions.length - 1) setCurrentIdx(currentIdx + 1);
// // //   };
// // //   const goPrev = () => {
// // //     if (currentIdx > 0) setCurrentIdx(currentIdx - 1);
// // //   };

// // //   // 🟢 Submit handler
// // //   const handleSubmit = async () => {
// // //     if (Object.keys(answers).length < questions.length) {
// // //       if (!window.confirm("Some questions are unanswered. Submit anyway?")) return;
// // //     }

// // //     // Calculate score only for MCQs
// // //     let s = 0;
// // //     questions.forEach((q) => {
// // //       if (q.questionType === "MCQ" && answers[q._id] === q.correctAnswer) s += 1;
// // //     });
// // //     setScore(s);
// // //     setSubmitted(true);

// // //     // Prepare formatted answers
// // //     const formattedAnswers = questions.map((q) => ({
// // //       question: q.questionText,
// // //       userAnswer: answers[q._id] || "Not answered",
// // //       correctAnswer: q.correctAnswer || "",
// // //       isCorrect: q.questionType === "MCQ" ? answers[q._id] === q.correctAnswer : null,
// // //       type: q.questionType || "Theory",
// // //     }));

// // //     try {
// // //       await API.tests.submit({
// // //         name: fullName,
// // //         email,
// // //         answers: formattedAnswers,
// // //         totalQuestions: questions.length,
// // //         correctAnswers: s,
// // //         scorePercent: ((s / questions.length) * 100).toFixed(2),
// // //       });
// // //       setResultSaved(true);
// // //     } catch (err) {
// // //       console.error("Error saving result:", err);
// // //       alert("Failed to save result to server.");
// // //     }
// // //   };

// // //   // 🛑 If test was ended (tab switch or reload)
// // //   if (testEnded) {
// // //     return (
// // //       <div className="container container-center">
// // //         <div className="card card-clean p-4 text-center">
// // //           <h3 className="text-danger">⚠️ Test Ended</h3>
// // //           <p>Your test session has ended because you switched tabs, reloaded, or left the page.</p>
// // //           <h4 className="mt-3 text-success">Thank you for your time!</h4>
// // //           <button
// // //             className="btn btn-primary mt-3"
// // //             onClick={() => navigate("/")}
// // //           >
// // //             Go to Home
// // //           </button>
// // //         </div>
// // //       </div>
// // //     );
// // //   }

// // //   if (loading) return <div className="container container-center">Loading questions…</div>;
// // //   if (!questions || questions.length === 0)
// // //     return <div className="container container-center">No questions available. Please try later.</div>;

// // //   if (submitted) {
// // //     return (
// // //       <div className="container container-center">
// // //         <div className="card card-clean p-4">
// // //           <h3 className="text-success">Test Completed Successfully</h3>
// // //           <p><strong>{fullName}</strong> ({email})</p>
// // //           <h4>Your Score: {score} / {questions.length}</h4>

// // //           {resultSaved && (
// // //             <div className="alert alert-success mt-2">
// // //               ✅ Your result has been recorded successfully!
// // //             </div>
// // //           )}

// // //           <hr />
// // //           <h5>Review Answers</h5>
// // //           <div>
// // //             {questions.map((q, idx) => (
// // //               <div className="review-question" key={q._id}>
// // //                 <b>Q{idx + 1}:</b> {q.questionText}
// // //                 <div>
// // //                   Your answer:{" "}
// // //                   <span
// // //                     className={
// // //                       q.questionType === "MCQ"
// // //                         ? answers[q._id] === q.correctAnswer
// // //                           ? "text-success"
// // //                           : "text-danger"
// // //                         : "text-primary"
// // //                     }
// // //                   >
// // //                     {answers[q._id] || "Not answered"}
// // //                   </span>
// // //                 </div>
// // //                 {q.questionType === "MCQ" && (
// // //                   <div>
// // //                     Correct answer:{" "}
// // //                     <span className="text-success">{q.correctAnswer}</span>
// // //                   </div>
// // //                 )}
// // //               </div>
// // //             ))}
// // //           </div>

// // //           <div className="mt-4">
// // //             <button className="btn btn-primary me-2" onClick={() => navigate("/")}>
// // //               Back to Home
// // //             </button>
// // //             <button className="btn btn-outline-secondary" onClick={() => window.location.reload()}>
// // //               Retake Test
// // //             </button>
// // //           </div>
// // //         </div>
// // //       </div>
// // //     );
// // //   }

// // //   const currentQ = questions[currentIdx];
// // //   const selectedAnswer = answers[currentQ._id] || "";

// // //   return (
// // //     <div className="test-container">
// // //       <div className="card test-card">
// // //         <div className="test-header">
// // //           <div>
// // //             <h5 className="text-danger fw-bold">
// // //               Candidate: {fullName.toLowerCase()}
// // //             </h5>
// // //             <small className="text-muted">{email}</small>
// // //           </div>
// // //           <div>
// // //             <span className="badge bg-primary">
// // //               Question {currentIdx + 1} / {questions.length}
// // //             </span>
// // //           </div>
// // //         </div>

// // //         <div className="test-body">
// // //           <h6 className="question-text">
// // //             <b>Q{currentIdx + 1}:</b> {currentQ.questionText}
// // //           </h6>

// // //           {currentQ.questionType === "MCQ" && currentQ.options?.length > 0 ? (
// // //             <div className="options-container">
// // //               {currentQ.options.map((opt, i) => (
// // //                 <label
// // //                   key={i}
// // //                   className={`option-item ${
// // //                     selectedAnswer === opt ? "selected" : ""
// // //                   }`}
// // //                 >
// // //                   <input
// // //                     type="radio"
// // //                     name={`question-${currentQ._id}`}
// // //                     value={opt}
// // //                     checked={selectedAnswer === opt}
// // //                     onChange={(e) => handleSelect(currentQ._id, e.target.value)}
// // //                   />
// // //                   {opt}
// // //                 </label>
// // //               ))}
// // //             </div>
// // //           ) : (
// // //             <textarea
// // //               className="theory-input"
// // //               placeholder="Type your answer here..."
// // //               value={selectedAnswer}
// // //               onChange={(e) => handleSelect(currentQ._id, e.target.value)}
// // //               rows={5}
// // //             ></textarea>
// // //           )}
// // //         </div>

// // //         <div className="test-footer">
// // //           <div>
// // //             <button
// // //               className="btn btn-secondary me-3"
// // //               onClick={goPrev}
// // //               disabled={currentIdx === 0}
// // //             >
// // //               Previous
// // //             </button>
// // //             <button
// // //               className="btn btn-secondary"
// // //               onClick={goNext}
// // //               disabled={currentIdx === questions.length - 1}
// // //             >
// // //               Next
// // //             </button>
// // //           </div>

// // //           <div>
// // //             <button className="btn btn-success" onClick={handleSubmit}>
// // //               Submit Test
// // //             </button>
// // //           </div>
// // //         </div>
// // //       </div>
// // //     </div>
// // //   );
// // // }

// // // // import React, { useEffect, useState } from "react";
// // // // import { useLocation, useNavigate } from "react-router-dom";
// // // // import API from "../services/api";
// // // // import "../styles/TestPage.css";

// // // // function pickRandom(arr, n) {
// // // //   const copy = [...arr];
// // // //   const res = [];
// // // //   while (res.length < n && copy.length > 0) {
// // // //     const idx = Math.floor(Math.random() * copy.length);
// // // //     res.push(copy.splice(idx, 1)[0]);
// // // //   }
// // // //   return res;
// // // // }

// // // // export default function TestPage() {
// // // //   const location = useLocation();
// // // //   const navigate = useNavigate();
// // // //   const { fullName, email, numQ } = location.state || {};

// // // //   const [allQuestions, setAllQuestions] = useState([]);
// // // //   const [questions, setQuestions] = useState([]);
// // // //   const [answers, setAnswers] = useState({});
// // // //   const [currentIdx, setCurrentIdx] = useState(0);
// // // //   const [loading, setLoading] = useState(true);
// // // //   const [submitted, setSubmitted] = useState(false);
// // // //   const [score, setScore] = useState(0);
// // // //   const [resultSaved, setResultSaved] = useState(false);

// // // //   // 🟢 Fetch questions
// // // //   useEffect(() => {
// // // //     if (!fullName || !email) {
// // // //       navigate("/");
// // // //       return;
// // // //     }

// // // //     const fetchQuestions = async () => {
// // // //       try {
// // // //         const res = await API.questions.getAll();
// // // //         setAllQuestions(res.data || []);
// // // //       } catch (err) {
// // // //         console.error(err);
// // // //         alert("Failed to fetch questions from server.");
// // // //       } finally {
// // // //         setLoading(false);
// // // //       }
// // // //     };

// // // //     fetchQuestions();
// // // //   }, [fullName, email, navigate]);

// // // //   // 🟢 Pick random questions
// // // //   useEffect(() => {
// // // //     if (!loading && allQuestions.length > 0) {
// // // //       const selected = pickRandom(allQuestions, Math.min(numQ || 10, allQuestions.length));
// // // //       setQuestions(selected);
// // // //     }
// // // //   }, [loading, allQuestions, numQ]);

// // // //   const handleSelect = (questionId, value) => {
// // // //     setAnswers({ ...answers, [questionId]: value });
// // // //   };

// // // //   const goNext = () => {
// // // //     if (currentIdx < questions.length - 1) setCurrentIdx(currentIdx + 1);
// // // //   };
// // // //   const goPrev = () => {
// // // //     if (currentIdx > 0) setCurrentIdx(currentIdx - 1);
// // // //   };

// // // //   // 🟢 Submit handler
// // // //   const handleSubmit = async () => {
// // // //     if (Object.keys(answers).length < questions.length) {
// // // //       if (!window.confirm("Some questions are unanswered. Submit anyway?")) return;
// // // //     }

// // // //     // Calculate score only for MCQs
// // // //     let s = 0;
// // // //     questions.forEach((q) => {
// // // //       if (q.questionType === "MCQ" && answers[q._id] === q.correctAnswer) s += 1;
// // // //     });
// // // //     setScore(s);
// // // //     setSubmitted(true);

// // // //     // Prepare formatted answers
// // // //     const formattedAnswers = questions.map((q) => ({
// // // //       question: q.questionText,
// // // //       userAnswer: answers[q._id] || "Not answered",
// // // //       correctAnswer: q.correctAnswer || "",
// // // //       isCorrect: q.questionType === "MCQ" ? answers[q._id] === q.correctAnswer : null,
// // // //       type: q.questionType || "Theory",
// // // //     }));

// // // //     try {
// // // //       await API.tests.submit({
// // // //         name: fullName,
// // // //         email,
// // // //         answers: formattedAnswers,
// // // //         totalQuestions: questions.length,
// // // //         correctAnswers: s,
// // // //         scorePercent: ((s / questions.length) * 100).toFixed(2),
// // // //       });
// // // //       setResultSaved(true);
// // // //     } catch (err) {
// // // //       console.error("Error saving result:", err);
// // // //       alert("Failed to save result to server.");
// // // //     }
// // // //   };

// // // //   if (loading) return <div className="container container-center">Loading questions…</div>;
// // // //   if (!questions || questions.length === 0)
// // // //     return <div className="container container-center">No questions available. Please try later.</div>;

// // // //   if (submitted) {
// // // //     return (
// // // //       <div className="container container-center">
// // // //         <div className="card card-clean p-4">
// // // //           <h3 className="text-success">Test Completed Successfully</h3>
// // // //           <p><strong>{fullName}</strong> ({email})</p>
// // // //           <h4>Your Score: {score} / {questions.length}</h4>

// // // //           {resultSaved && (
// // // //             <div className="alert alert-success mt-2">
// // // //               ✅ Your result has been recorded successfully!
// // // //             </div>
// // // //           )}

// // // //           <hr />
// // // //           <h5>Review Answers</h5>
// // // //           <div>
// // // //             {questions.map((q, idx) => (
// // // //               <div className="review-question" key={q._id}>
// // // //                 <b>Q{idx + 1}:</b> {q.questionText}
// // // //                 <div>
// // // //                   Your answer:{" "}
// // // //                   <span
// // // //                     className={
// // // //                       q.questionType === "MCQ"
// // // //                         ? answers[q._id] === q.correctAnswer
// // // //                           ? "text-success"
// // // //                           : "text-danger"
// // // //                         : "text-primary"
// // // //                     }
// // // //                   >
// // // //                     {answers[q._id] || "Not answered"}
// // // //                   </span>
// // // //                 </div>
// // // //                 {q.questionType === "MCQ" && (
// // // //                   <div>
// // // //                     Correct answer:{" "}
// // // //                     <span className="text-success">{q.correctAnswer}</span>
// // // //                   </div>
// // // //                 )}
// // // //               </div>
// // // //             ))}
// // // //           </div>

// // // //           <div className="mt-4">
// // // //             <button className="btn btn-primary me-2" onClick={() => navigate("/")}>
// // // //               Back to Home
// // // //             </button>
// // // //             <button className="btn btn-outline-secondary" onClick={() => window.location.reload()}>
// // // //               Retake Test
// // // //             </button>
// // // //           </div>
// // // //         </div>
// // // //       </div>
// // // //     );
// // // //   }

// // // //   const currentQ = questions[currentIdx];
// // // //   const selectedAnswer = answers[currentQ._id] || "";

// // // //   return (
// // // //     <div className="test-container">
// // // //       <div className="card test-card">
// // // //         <div className="test-header">
// // // //           <div>
// // // //             <h5 className="text-danger fw-bold">
// // // //               Candidate: {fullName.toLowerCase()}
// // // //             </h5>
// // // //             <small className="text-muted">{email}</small>
// // // //           </div>
// // // //           <div>
// // // //             <span className="badge bg-primary">
// // // //               Question {currentIdx + 1} / {questions.length}
// // // //             </span>
// // // //           </div>
// // // //         </div>

// // // //         <div className="test-body">
// // // //           <h6 className="question-text">
// // // //              <b>Q{currentIdx + 1}:</b> {currentQ.questionText}
// // // //           </h6>

// // // //           {/* 🧠 Conditional rendering for MCQ / Theory */}
// // // //           {currentQ.questionType === "MCQ" && currentQ.options?.length > 0 ? (
// // // //             <div className="options-container">
// // // //               {currentQ.options.map((opt, i) => (
// // // //                 <label
// // // //                   key={i}
// // // //                   className={`option-item ${
// // // //                     selectedAnswer === opt ? "selected" : ""
// // // //                   }`}
// // // //                 >
// // // //                   <input
// // // //                     type="radio"
// // // //                     name={`question-${currentQ._id}`}
// // // //                     value={opt}
// // // //                     checked={selectedAnswer === opt}
// // // //                     onChange={(e) => handleSelect(currentQ._id, e.target.value)}
// // // //                   />
// // // //                   {opt}
// // // //                 </label>
// // // //               ))}
// // // //             </div>
// // // //           ) : (
// // // //             <textarea
// // // //               className="theory-input"
// // // //               placeholder="Type your answer here..."
// // // //               value={selectedAnswer}
// // // //               onChange={(e) => handleSelect(currentQ._id, e.target.value)}
// // // //               rows={5}
// // // //             ></textarea>
// // // //           )}
// // // //         </div>

// // // //         <div className="test-footer">
// // // //           <div>
// // // //             <button
// // // //               className="btn btn-secondary me-3"
// // // //               onClick={goPrev}
// // // //               disabled={currentIdx === 0}
// // // //             >
// // // //               Previous
// // // //             </button>
// // // //             <button
// // // //               className="btn btn-secondary"
// // // //               onClick={goNext}
// // // //               disabled={currentIdx === questions.length - 1}
// // // //             >
// // // //               Next
// // // //             </button>
// // // //           </div>

// // // //           <div>
// // // //             {/* <button
// // // //               className="btn btn-danger me-2"
// // // //               onClick={() => {
// // // //                 if (window.confirm("Are you sure you want to abandon this test?"))
// // // //                   navigate("/");
// // // //               }}
// // // //             >
// // // //               Abandon
// // // //             </button> */}
// // // //             <button className="btn btn-success" onClick={handleSubmit}>
// // // //               Submit Test
// // // //             </button>
// // // //           </div>
// // // //         </div>
// // // //       </div>
// // // //     </div>
// // // //   );
// // // // }

// // // // import React, { useEffect, useState } from "react";
// // // // import { useLocation, useNavigate } from "react-router-dom";
// // // // import API from "../services/api";
// // // // import QuestionCard from "../components/QuestionCard";
// // // // import "../styles/TestPage.css";

// // // // function pickRandom(arr, n) {
// // // //   const copy = [...arr];
// // // //   const res = [];
// // // //   while (res.length < n && copy.length > 0) {
// // // //     const idx = Math.floor(Math.random() * copy.length);
// // // //     res.push(copy.splice(idx, 1)[0]);
// // // //   }
// // // //   return res;
// // // // }

// // // // export default function TestPage() {
// // // //   const location = useLocation();
// // // //   const navigate = useNavigate();
// // // //   const { fullName, email, numQ } = location.state || {};
// // // //   const [allQuestions, setAllQuestions] = useState([]);
// // // //   const [questions, setQuestions] = useState([]);
// // // //   const [answers, setAnswers] = useState({});
// // // //   const [currentIdx, setCurrentIdx] = useState(0);
// // // //   const [loading, setLoading] = useState(true);
// // // //   const [submitted, setSubmitted] = useState(false);
// // // //   const [score, setScore] = useState(0);
// // // //   const [resultSaved, setResultSaved] = useState(false);

// // // //   useEffect(() => {
// // // //     if (!fullName || !email) {
// // // //       navigate("/");
// // // //       return;
// // // //     }

// // // //     const fetchQuestions = async () => {
// // // //       try {
// // // //         const res = await API.get("/questions");
// // // //         setAllQuestions(res.data || []);
// // // //       } catch (err) {
// // // //         console.error(err);
// // // //         alert("Failed to fetch questions from server.");
// // // //       } finally {
// // // //         setLoading(false);
// // // //       }
// // // //     };

// // // //     fetchQuestions();
// // // //   }, [fullName, email, navigate]);

// // // //   useEffect(() => {
// // // //     if (!loading && allQuestions.length > 0) {
// // // //       const selected = pickRandom(allQuestions, Math.min(numQ || 10, allQuestions.length));
// // // //       setQuestions(selected);
// // // //     }
// // // //   }, [loading, allQuestions, numQ]);

// // // //   const handleSelect = (opt) => {
// // // //     const q = questions[currentIdx];
// // // //     setAnswers({ ...answers, [q._id]: opt });
// // // //   };

// // // //   const goNext = () => {
// // // //     if (currentIdx < questions.length - 1) setCurrentIdx(currentIdx + 1);
// // // //   };
// // // //   const goPrev = () => {
// // // //     if (currentIdx > 0) setCurrentIdx(currentIdx - 1);
// // // //   };

// // // //   const handleSubmit = async () => {
// // // //     if (Object.keys(answers).length < questions.length) {
// // // //       if (!window.confirm("Some questions are unanswered. Submit anyway?")) return;
// // // //     }

// // // //     // calculate score
// // // //     let s = 0;
// // // //     questions.forEach((q) => {
// // // //       if (answers[q._id] && answers[q._id] === q.correctAnswer) s += 1;
// // // //     });
// // // //     setScore(s);
// // // //     setSubmitted(true);

// // // //     // format answers for backend
// // // //     const formattedAnswers = questions.map((q) => ({
// // // //       question: q.questionText,
// // // //       userAnswer: answers[q._id] || "Not answered",
// // // //       correctAnswer: q.correctAnswer,
// // // //       isCorrect: answers[q._id] === q.correctAnswer,
// // // //     }));

// // // //     try {
// // // //       await API.post("/tests", {
// // // //         name: fullName,
// // // //         email,
// // // //         answers: formattedAnswers,
// // // //       });
// // // //       setResultSaved(true);
// // // //     } catch (err) {
// // // //       console.error("Error saving result:", err);
// // // //       alert("Failed to save result to server.");
// // // //     }
// // // //   };

// // // //   if (loading) return <div className="container container-center">Loading questions…</div>;
// // // //   if (!questions || questions.length === 0)
// // // //     return <div className="container container-center">No questions available. Please try later.</div>;

// // // //   if (submitted) {
// // // //     return (
// // // //       <div className="container container-center">
// // // //         <div className="card card-clean p-4">
// // // //           <h3 className="text-success">Test Completed Successfully</h3>
// // // //           <p><strong>{fullName}</strong> ({email})</p>
// // // //           <h4>Your Score: {score} / {questions.length}</h4>

// // // //           {resultSaved && (
// // // //             <div className="alert alert-success mt-2">
// // // //               ✅ Your result has been recorded successfully!
// // // //             </div>
// // // //           )}

// // // //           <hr />
// // // //           <h5>Review Answers</h5>
// // // //           <div>
// // // //             {questions.map((q, idx) => (
// // // //               <div className="mb-3" key={q._id}>
// // // //                 <b>Q{idx + 1}:</b> {q.questionText}
// // // //                 <div>
// // // //                   Your answer:{" "}
// // // //                   <span
// // // //                     className={
// // // //                       answers[q._id] === q.correctAnswer
// // // //                         ? "text-success"
// // // //                         : "text-danger"
// // // //                     }
// // // //                   >
// // // //                     {answers[q._id] || "Not answered"}
// // // //                   </span>
// // // //                 </div>
// // // //                 <div>
// // // //                   Correct answer:{" "}
// // // //                   <span className="text-success">{q.correctAnswer}</span>
// // // //                 </div>
// // // //               </div>
// // // //             ))}
// // // //           </div>

// // // //           <div className="mt-3">
// // // //             <button className="btn btn-primary me-2" onClick={() => navigate("/")}>
// // // //               Back to Home
// // // //             </button>
// // // //             <button className="btn btn-outline-secondary" onClick={() => window.location.reload()}>
// // // //               Retake Test
// // // //             </button>
// // // //           </div>
// // // //         </div>
// // // //       </div>
// // // //     );
// // // //   }

// // // //   const currentQ = questions[currentIdx];
// // // //   const selectedForCurrent = answers[currentQ._id];

// // // //   return (
// // // //     <div className="container container-center">
// // // //       <div className="card card-clean p-4">
// // // //         <div className="d-flex justify-content-between align-items-start">
// // // //           <div>
// // // //             <h5 className="mb-0">Candidate: {fullName}</h5>
// // // //             <small className="text-muted">{email}</small>
// // // //           </div>
// // // //           <div>
// // // //             <span className="badge bg-primary">
// // // //               Question {currentIdx + 1} / {questions.length}
// // // //             </span>
// // // //           </div>
// // // //         </div>

// // // //         <div className="mt-4">
// // // //           <QuestionCard
// // // //             question={currentQ}
// // // //             selectedAnswer={selectedForCurrent}
// // // //             onSelect={handleSelect}
// // // //           />
// // // //         </div>

// // // //         <div className="mt-3 d-flex justify-content-between">
// // // //           <div>
// // // //             <button
// // // //               className="btn btn-secondary me-2"
// // // //               onClick={goPrev}
// // // //               disabled={currentIdx === 0}
// // // //             >
// // // //               Previous
// // // //             </button>
// // // //             <button
// // // //               className="btn btn-secondary"
// // // //               onClick={goNext}
// // // //               disabled={currentIdx === questions.length - 1}
// // // //             >
// // // //               Next
// // // //             </button>
// // // //           </div>

// // // //           <div>
// // // //             <button
// // // //               className="btn btn-danger me-2"
// // // //               onClick={() => {
// // // //                 if (window.confirm("Are you sure you want to abandon this test?"))
// // // //                   navigate("/");
// // // //               }}
// // // //             >
// // // //               Abandon
// // // //             </button>

// // // //             <button className="btn btn-success" onClick={handleSubmit}>
// // // //               Submit Test
// // // //             </button>
// // // //           </div>
// // // //         </div>
// // // //       </div>
// // // //     </div>
// // // //   );
// // // // }

// // // // // import React, { useEffect, useState } from "react";
// // // // // import { useLocation, useNavigate } from "react-router-dom";
// // // // // import API from "../services/api";
// // // // // import QuestionCard from "../components/QuestionCard";
// // // // // import "../styles/TestPage.css";

// // // // // function pickRandom(arr, n) {
// // // // //   const copy = [...arr];
// // // // //   const res = [];
// // // // //   while (res.length < n && copy.length > 0) {
// // // // //     const idx = Math.floor(Math.random() * copy.length);
// // // // //     res.push(copy.splice(idx, 1)[0]);
// // // // //   }
// // // // //   return res;
// // // // // }

// // // // // export default function TestPage() {
// // // // //   const location = useLocation();
// // // // //   const navigate = useNavigate();
// // // // //   const { fullName, email, numQ } = location.state || {};
// // // // //   const [allQuestions, setAllQuestions] = useState([]);
// // // // //   const [questions, setQuestions] = useState([]);
// // // // //   const [answers, setAnswers] = useState({}); // { questionId: selectedOption }
// // // // //   const [currentIdx, setCurrentIdx] = useState(0);
// // // // //   const [loading, setLoading] = useState(true);
// // // // //   const [submitted, setSubmitted] = useState(false);
// // // // //   const [score, setScore] = useState(0);

// // // // //   useEffect(() => {
// // // // //     if (!fullName || !email) {
// // // // //       // if page opened without details -> back to home
// // // // //       navigate("/");
// // // // //       return;
// // // // //     }

// // // // //     const fetchQuestions = async () => {
// // // // //       try {
// // // // //         const res = await API.get("/questions");
// // // // //         setAllQuestions(res.data || []);
// // // // //       } catch (err) {
// // // // //         console.error(err);
// // // // //         alert("Failed to fetch questions from server.");
// // // // //       } finally {
// // // // //         setLoading(false);
// // // // //       }
// // // // //     };

// // // // //     fetchQuestions();
// // // // //   }, [fullName, email, navigate]);

// // // // //   useEffect(() => {
// // // // //     if (!loading && allQuestions.length > 0) {
// // // // //       const chunk = pickRandom(allQuestions, Math.min(numQ || 10, allQuestions.length));
// // // // //       setQuestions(chunk);
// // // // //     }
// // // // //   }, [loading, allQuestions, numQ]);

// // // // //   const handleSelect = (opt) => {
// // // // //     const q = questions[currentIdx];
// // // // //     setAnswers({ ...answers, [q._id]: opt });
// // // // //   };

// // // // //   const goNext = () => {
// // // // //     if (currentIdx < questions.length - 1) setCurrentIdx(currentIdx + 1);
// // // // //   };
// // // // //   const goPrev = () => {
// // // // //     if (currentIdx > 0) setCurrentIdx(currentIdx - 1);
// // // // //   };

// // // // //   const handleSubmit = () => {
// // // // //     // ensure all answered
// // // // //     if (Object.keys(answers).length < questions.length) {
// // // // //       if (!window.confirm("Some questions are unanswered. Submit anyway?")) return;
// // // // //     }

// // // // //     // compute score
// // // // //     let s = 0;
// // // // //     questions.forEach((q) => {
// // // // //       if (answers[q._id] && answers[q._id] === q.correctAnswer) s += 1;
// // // // //     });
// // // // //     setScore(s);
// // // // //     setSubmitted(true);
// // // // //   };

// // // // //   if (loading) return <div className="container container-center">Loading questions…</div>;
// // // // //   if (!questions || questions.length === 0) return <div className="container container-center">No questions available. Please try later.</div>;

// // // // //   if (submitted) {
// // // // //     return (
// // // // //       <div className="container container-center">
// // // // //         <div className="card card-clean p-4">
// // // // //           <h3>Test Completed</h3>
// // // // //           <p><strong>{fullName}</strong> ({email})</p>
// // // // //           <h4>Your score: {score} out of {questions.length}</h4>
// // // // //           <hr />
// // // // //           <h5>Review</h5>
// // // // //           <div>
// // // // //             {questions.map((q, idx) => (
// // // // //               <div className="mb-3" key={q._id}>
// // // // //                 <b>Q{idx + 1}:</b> {q.questionText}
// // // // //                 <div>Your answer: <span className={answers[q._id] === q.correctAnswer ? "text-success" : "text-danger"}>{answers[q._id] || "Not answered"}</span></div>
// // // // //                 <div>Correct answer: <span className="text-success">{q.correctAnswer}</span></div>
// // // // //               </div>
// // // // //             ))}
// // // // //           </div>

// // // // //           <div className="mt-3">
// // // // //             <button className="btn btn-primary me-2" onClick={() => navigate("/")}>Back to Home</button>
// // // // //             <button className="btn btn-outline-secondary" onClick={() => window.location.reload()}>Take New Test</button>
// // // // //           </div>
// // // // //         </div>
// // // // //       </div>
// // // // //     );
// // // // //   }

// // // // //   const currentQ = questions[currentIdx];
// // // // //   const selectedForCurrent = answers[currentQ._id];

// // // // //   return (
// // // // //     <div className="container container-center">
// // // // //       <div className="card card-clean p-4">
// // // // //         <div className="d-flex justify-content-between align-items-start">
// // // // //           <div>
// // // // //             <h5 className="mb-0">Candidate: {fullName}</h5>
// // // // //             <small className="text-muted">{email}</small>
// // // // //           </div>
// // // // //           <div>
// // // // //             <span className="badge bg-primary">Question {currentIdx + 1} / {questions.length}</span>
// // // // //           </div>
// // // // //         </div>

// // // // //         <div className="mt-4">
// // // // //           <QuestionCard question={currentQ} selectedAnswer={selectedForCurrent} onSelect={handleSelect} />
// // // // //         </div>

// // // // //         <div className="mt-3 d-flex justify-content-between">
// // // // //           <div>
// // // // //             <button className="btn btn-secondary me-2" onClick={goPrev} disabled={currentIdx === 0}>Previous</button>
// // // // //             <button className="btn btn-secondary" onClick={goNext} disabled={currentIdx === questions.length - 1}>Next</button>
// // // // //           </div>

// // // // //           <div>
// // // // //             <button className="btn btn-danger me-2" onClick={() => {
// // // // //               if (window.confirm("Are you sure you want to abandon this test?")) navigate("/");
// // // // //             }}>Abandon</button>

// // // // //             <button className="btn btn-success" onClick={handleSubmit}>Submit Test</button>
// // // // //           </div>
// // // // //         </div>
// // // // //       </div>
// // // // //     </div>
// // // // //   );
// // // // // }
