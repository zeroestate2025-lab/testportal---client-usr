import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Home.css";
import API from "../services/api"; // ✅ Import your combined API file

export default function Home() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [numQ, setNumQ] = useState(10);
  const navigate = useNavigate();

  const handleStart = async () => {
    // ✅ Simple validation without trim()
    if (!fullName || !email) {
      alert("Please enter your full name and email.");
      return;
    }

    try {
      // ✅ Use your API module for user registration
      const res = await API.user.register({ fullName, email });

      console.log("✅ Registered:", res.data);

      // ✅ Navigate to test page with user info
      navigate("/test", {
        state: {
          fullName,
          email,
          numQ,
          userId: res.data.userId, // assuming API returns this field
        },
      });
    } catch (error) {
      console.error("❌ Registration error:", error);
      alert(
        error.response?.data?.error ||
          "Registration failed. Please try again later."
      );
    }
  };

  return (
    <div className="container container-center">
      <div className="header-banner mb-4">
        <h1 className="display-6">VLSI Interview Assessment</h1>
        <p className="lead">
          Test your knowledge of Very Large Scale Integration (VLSI) concepts
        </p>
      </div>

      <div className="card card-clean p-4 mb-4">
        <h5>Start Your Interview Test</h5>
        <p className="text-muted">
          You will be presented with randomly selected questions. Please answer
          to the best of your ability.
        </p>

        <div className="row g-3">
          <div className="col-md-6">
            <label className="form-label">Full Name *</label>
            <input
              className="form-control"
              placeholder="Enter your full name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
          </div>

          <div className="col-md-6">
            <label className="form-label">Email Address *</label>
            <input
              className="form-control"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="col-12 mt-3">
            <button
              className="btn btn-primary btn-lg w-100"
              onClick={handleStart}
            >
              Start Test
            </button>
          </div>
        </div>
      </div>

      <div className="card card-clean p-3">
        <h6>Instructions</h6>
        <ul>
          <li>Read each question carefully before answering.</li>
          <li>Use Next and Previous to navigate.</li>
          <li>Submit once all questions are answered.</li>
        </ul>
      </div>
    </div>
  );
}


// import React, { useState } from "react";
// import { useNavigate } from "react-router-dom";
// import "../styles/Home.css";

// export default function Home() {
//   const [fullName, setFullName] = useState("");
//   const [email, setEmail] = useState("");
//   const [numQ, setNumQ] = useState(10);
//   const navigate = useNavigate();

//   // const handleStart = () => {
//   //   if (!fullName.trim() || !email.trim()) {
//   //     return alert("Please enter your full name and email.");
//   //   }
//   //   // Navigate to test page with state (we pass via router state)
//   //   navigate("/test", { state: { fullName, email, numQ } });
//   // };

//     const handleStart = async () => {
//     if (!fullName.trim() || !email.trim()) {
//       return alert("Please enter your full name and email.");
//     }

//     try {
//       const res = await fetch("http://localhost:5000/api/user/register", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ fullName, email }),
//       });
//       const data = await res.json();

//       if (res.ok) {
//         console.log("✅ Registered:", data);
//         // Go to test waiting screen (or directly test page later)
//         navigate("/test", { state: { fullName, email, numQ, userId: data.userId } });
//       } else {
//         alert(data.error || "Registration failed.");
//       }
//     } catch (error) {
//       console.error("❌ Registration error:", error);
//       alert("Something went wrong.");
//     }
//   };


//   return (
//     <div className="container container-center">
//       <div className="header-banner mb-4">
//         <h1 className="display-6">VLSI Interview Assessment</h1>
//         <p className="lead">Test your knowledge of Very Large Scale Integration (VLSI) concepts</p>
//       </div>

//       <div className="card card-clean p-4 mb-4">
//         <h5>Start Your Interview Test</h5>
//         <p className="text-muted">You will be presented with randomly selected questions. Please answer to the best of your ability.</p>

//         <div className="row g-3">
//           <div className="col-md-6">
//             <label className="form-label">Full Name *</label>
//             <input className="form-control" placeholder="Enter your full name" value={fullName} onChange={(e) => setFullName(e.target.value)} />
//           </div>

//           <div className="col-md-6">
//             <label className="form-label">Email Address *</label>
//             <input className="form-control" placeholder="Enter your email" value={email} onChange={(e) => setEmail(e.target.value)} />
//           </div>

//           {/* <div className="col-md-6">
//             <label className="form-label">Number of Questions</label>
//             <select className="form-select" value={numQ} onChange={(e) => setNumQ(Number(e.target.value))}>
//               <option value={5}>5 Questions</option>
//               <option value={10}>10 Questions</option>
//             </select>
//           </div> */}

//           <div className="col-12 mt-3">
//             <button className="btn btn-primary btn-lg w-100" onClick={handleStart}>Start Test</button>
//           </div>
//         </div>
//       </div>

//       <div className="card card-clean p-3">
//         <h6>Instructions</h6>
//         <ul>
//           <li>Read each question carefully before answering.</li>
//           <li>Use Next and Previous to navigate.</li>
//           <li>Submit once all questions are answered.</li>
//         </ul>
//       </div>
//     </div>
//   );
// }
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

// // //   // 🟢 Fetch questions ONLY when admin starts test (fully backend controlled)
// // //   useEffect(() => {
// // //     if (!fullName || !email) {
// // //       navigate("/");
// // //       return;
// // //     }

// // //     const fetchQuestions = async () => {
// // //       try {
// // //         const res = await API.questions.getAll();

// // //         // 🛑 If admin hasn't started the test
// // //         if (res.data?.error) {
// // //           setTestNotStarted(true);
// // //           setLoading(false);
// // //           return;
// // //         }

// // //         // ✅ Admin-defined number of questions & time limit
// // //         setQuestions(res.data.questions || []);
// // //         setTimeLeft((res.data.timeLimit || 10) * 60); // Convert minutes → seconds
// // //       } catch (err) {
// // //         console.error("❌ Error fetching questions:", err);
// // //         alert("Please wait for admin to start the test.");
// // //         setTestNotStarted(true);
// // //       } finally {
// // //         setLoading(false);
// // //       }
// // //     };

// // //     fetchQuestions();
// // //   }, [fullName, email, navigate]);

// // //   // 🕒 Countdown timer based on admin-defined time
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

// // //   // 🛑 Detect tab switch, reload, or page exit → terminate test
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

// // //   // 🟢 Record answer
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

// // //   // 🟢 Submit test (auto or manual)
// // //   const handleSubmit = async () => {
// // //     if (submitted) return;
// // //     if (Object.keys(answers).length < questions.length) {
// // //       if (!window.confirm("Some questions are unanswered. Submit anyway?")) return;
// // //     }

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
// // //       console.error("❌ Error saving result:", err);
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

// // //   // 🛑 If test not started by admin
// // //   if (testNotStarted) {
// // //     return (
// // //       <div className="container container-center">
// // //         <div className="card card-clean p-4 text-center">
// // //           <h3 className="text-warning">⚠️ Test Not Active</h3>
// // //           <p>The test has not been started by the administrator.</p>
// // //           <h5 className="mt-2">Please contact admin to start your test.</h5>
// // //           <button className="btn btn-primary mt-3" onClick={() => navigate("/")}>
// // //             Back to Home
// // //           </button>
// // //         </div>
// // //       </div>
// // //     );
// // //   }

// // //   // 🟢 Loading screen
// // //   if (loading)
// // //     return <div className="container container-center">Loading questions…</div>;

// // //   if (!questions || questions.length === 0)
// // //     return (
// // //       <div className="container container-center">
// // //         No questions available. Please try later.
// // //       </div>
// // //     );

// // //   // 🟢 After submission — review screen
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
// // //             <button
// // //               className="btn btn-outline-secondary"
// // //               onClick={() => window.location.reload()}
// // //             >
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
// // //         {/* Header */}
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

// // //         {/* Question Body */}
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

// // //         {/* Footer */}
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

// // import React, { useState } from "react";
// // import { useNavigate } from "react-router-dom";
// // import "../styles/Home.css";

// // export default function Home() {
// //   const [fullName, setFullName] = useState("");
// //   const [email, setEmail] = useState("");
// //   const [numQ, setNumQ] = useState(10);
// //   const navigate = useNavigate();

// //   const handleStart = () => {
// //     if (!fullName.trim() || !email.trim()) {
// //       return alert("Please enter your full name and email.");
// //     }
// //     // Navigate to test page with state (we pass via router state)
// //     navigate("/test", { state: { fullName, email, numQ } });
// //   };

// //   return (
// //     <div className="container container-center">
// //       <div className="header-banner mb-4">
// //         <h1 className="display-6">VLSI Interview Assessment</h1>
// //         <p className="lead">Test your knowledge of Very Large Scale Integration (VLSI) concepts</p>
// //       </div>

// //       <div className="card card-clean p-4 mb-4">
// //         <h5>Start Your Interview Test</h5>
// //         <p className="text-muted">You will be presented with randomly selected questions. Please answer to the best of your ability.</p>

// //         <div className="row g-3">
// //           <div className="col-md-6">
// //             <label className="form-label">Full Name *</label>
// //             <input className="form-control" placeholder="Enter your full name" value={fullName} onChange={(e) => setFullName(e.target.value)} />
// //           </div>

// //           <div className="col-md-6">
// //             <label className="form-label">Email Address *</label>
// //             <input className="form-control" placeholder="Enter your email" value={email} onChange={(e) => setEmail(e.target.value)} />
// //           </div>

// //           {/* <div className="col-md-6">
// //             <label className="form-label">Number of Questions</label>
// //             <select className="form-select" value={numQ} onChange={(e) => setNumQ(Number(e.target.value))}>
// //               <option value={5}>5 Questions</option>
// //               <option value={10}>10 Questions</option>
// //             </select>
// //           </div> */}

// //           <div className="col-12 mt-3">
// //             <button className="btn btn-primary btn-lg w-100" onClick={handleStart}>Start Test</button>
// //           </div>
// //         </div>
// //       </div>

// //       <div className="card card-clean p-3">
// //         <h6>Instructions</h6>
// //         <ul>
// //           <li>Read each question carefully before answering.</li>
// //           <li>Use Next and Previous to navigate.</li>
// //           <li>Submit once all questions are answered.</li>
// //         </ul>
// //       </div>
// //     </div>
// //   );
// // }
