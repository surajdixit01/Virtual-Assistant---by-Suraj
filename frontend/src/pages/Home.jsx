import React, { useContext, useEffect, useRef, useState } from "react";
import { userDataContext } from "../context/UserContext";
import { useNavigate } from "react-router-dom";
import aiImg from "../assets/ai.gif";
import userImg from "../assets/user.gif";
import { TfiMenuAlt } from "react-icons/tfi";
import { RxCrossCircled } from "react-icons/rx";
import axios from "axios";

function Home() {
  const { userData, serverUrl, setUserData, getGeminiResponse } =
    useContext(userDataContext);
  const navigate = useNavigate();
  const [listening, setListening] = useState(false);
  const [userText, setUserText] = useState("");
  const [aiText, setAiText] = useState("");
  const [ham, setHam] = useState(false);

  const isSpeakingRef = useRef(false);
  const recognitionRef = useRef(null);
  const isRecognizingRef = useRef(false);

  const synth = window.speechSynthesis;

  const handleLogOut = async () => {
    try {
      await axios.get(`${serverUrl}/api/auth/logout`, { withCredentials: true });
      setUserData(null);
      navigate("/signin");
    } catch (error) {
      setUserData(null);
      console.log(error);
    }
  };

  const startRecognition = () => {
    if (!isSpeakingRef.current && !isRecognizingRef.current) {
      try {
        recognitionRef.current?.start();
        console.log("Recognition requested to start ");
      } catch (error) {
        if (error.name !== "InvalidStateError") {
          console.error("Start error :", error);
        }
      }
    }
  };

  const speak = (text) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "hi-IN";
    const voices = window.speechSynthesis.getVoices();
    const hindiVoice = voices.find((v) => v.lang === "hi-IN");
    if (hindiVoice) utterance.voice = hindiVoice;

    isSpeakingRef.current = true;
    utterance.onend = () => {
      setAiText("");
      isSpeakingRef.current = false;
      setTimeout(() => {
        startRecognition();
      }, 800);
    };

    synth.cancel();
    synth.speak(utterance);
  };

  const handleCommand = (data) => {
    const { type, userInput, response } = data;
    if (response) speak(response);

    if (type === "google_search") {
      const query = encodeURIComponent(userInput);
      window.open(`https://www.google.com/search?q=${query}`, "_blank");
    }

    if (type === "calculator_open") {
      window.open("https://www.google.com/search?q=calculator", "_blank");
    }

    if (type === "instagram_open") {
      window.open(`https://www.instagram.com/`, "_blank");
    }

    if (type === "facebook_open") {
      window.open(`https://www.facebook.com/`, "_blank");
    }

    if (type === "weather_show") {
      window.open(`https://www.google.com/search?q=weather`, "_blank");
    }

    if (type === "youtube_search" || type === "youtube_play") {
      const query = encodeURIComponent(userInput);
      window.open(
        `https://www.youtube.com/results?search_query=${query}`,
        "_blank"
      );
    }
  };

  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognitionRef.current = recognition;

    let isMounted = true;
    const startTimeout = setTimeout(() => {
      if (isMounted && !isSpeakingRef.current && !isRecognizingRef.current) {
        try {
          recognition.start();
          console.log("Recognition requested to start");
        } catch (e) {
          if (e.name !== "InvalidStateError") {
            console.error(e);
          }
        }
      }
    }, 1000);

    recognition.onstart = () => {
      isRecognizingRef.current = true;
      setListening(true);
    };

    recognition.onend = () => {
      isRecognizingRef.current = false;
      setListening(false);
      if (isMounted && !isSpeakingRef.current) {
        setTimeout(() => {
          if (isMounted) {
            try {
              recognition.start();
              console.log("Recognition restarted");
            } catch (error) {
              if (error.name !== "InvalidStateError") {
                console.error(error);
              }
            }
          }
        }, 1000);
      }
    };

    recognition.onerror = (event) => {
      console.warn("Recognition error :", event.error);
      isRecognizingRef.current = false;
      setListening(false);
      if (event.error !== "aborted" && isMounted && !isSpeakingRef.current) {
        setTimeout(() => {
          if (isMounted) {
            try {
              recognition.start();
              console.log("Recognition restarted after error");
            } catch (error) {
              if (error.name !== "InvalidStateError") {
                console.error(error);
              }
            }
          }
        }, 1000);
      }
    };

    recognition.onresult = async (e) => {
      const transcript =
        e.results[e.results.length - 1][0].transcript.trim();

      if (
        transcript
          .toLowerCase()
          .includes(userData.assistantName.toLowerCase())
      ) {
        setAiText("");
        setUserText(transcript);
        recognition.stop();
        isRecognizingRef.current = false;
        setListening(false);

        const data = await getGeminiResponse(transcript);
        handleCommand(data);
        setAiText(data.response);
        setUserText("");
      }
    };

    const greeting = new SpeechSynthesisUtterance(
      `Hello ${userData.name}, what can I help you with ?`
    );
    greeting.lang = "hi-IN";
    window.speechSynthesis.speak(greeting);

    return () => {
      isMounted = false;
      clearTimeout(startTimeout);
      recognition.stop();
      setListening(false);
      isRecognizingRef.current = false;
    };
  }, []);

  return (
    <div className="min-h-screen w-full bg-gradient-to-t from-black to-[#030353] flex justify-center items-center flex-col gap-4 overflow-hidden relative">
      {/* Mobile Hamburger */}
      <TfiMenuAlt
        className="lg:hidden absolute text-white top-5 right-5 w-7 h-7 cursor-pointer"
        onClick={() => setHam(true)}
      />

      {/* Mobile Sidebar */}
      <div
        className={`fixed top-0 right-0 w-3/4 max-w-[320px] h-full bg-[#0f0f2d] shadow-lg z-50 p-5 flex flex-col gap-5 transition-transform duration-300 ${
          ham ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Cross Button */}
        <RxCrossCircled
          className="absolute text-white top-5 right-5 w-7 h-7 cursor-pointer"
          onClick={() => setHam(false)}
        />

        <div className="mt-20 flex flex-col gap-4">
          <button
            className="w-full h-[45px] bg-white rounded-full text-black font-semibold text-base"
            onClick={handleLogOut}
          >
            Log Out
          </button>
          <button
            className="w-full h-[45px] bg-white rounded-full text-black font-semibold text-base"
            onClick={() => navigate("/customize")}
          >
            Customize Assistant
          </button>

          <div className="w-full h-[1px] bg-gray-500 my-2"></div>
          <h1 className="text-white font-semibold text-base">History</h1>
          <div className="flex flex-col gap-2 max-h-[60vh] overflow-y-auto pr-2">
            {userData?.history && userData.history.length > 0 ? (
              userData.history.map((his, index) => (
                <span
                  key={index}
                  className="text-gray-300 text-sm border-b border-gray-600 pb-1 cursor-pointer"
                  onClick={() => setHam(false)} // auto-close sidebar when clicked
                >
                  {his}
                </span>
              ))
            ) : (
              <span className="text-gray-400 text-sm">No history yet</span>
            )}
          </div>
        </div>
      </div>

      {/* Desktop Buttons */}
      <button
        className="hidden lg:block absolute top-5 right-5 min-w-[150px] h-[45px] bg-white rounded-full text-black font-semibold text-base"
        onClick={handleLogOut}
      >
        Log Out
      </button>
      <button
        className="hidden lg:block absolute top-[70px] right-5 min-w-[150px] h-[45px] bg-white rounded-full text-black font-semibold text-base"
        onClick={() => navigate("/customize")}
      >
        Customize
      </button>

      {/* Assistant UI */}
      <div className="w-[220px] h-[280px] flex justify-center items-center overflow-hidden rounded-2xl shadow-lg">
        <img
          src={userData?.assistantImage}
          alt="assistant"
          className="h-full object-cover"
        />
      </div>
      <h1 className="text-white text-base font-semibold text-center">
        I am {userData?.assistantName}
      </h1>

      {!aiText && <img src={userImg} className="w-[130px]" />}
      {aiText && <img src={aiImg} className="w-[130px]" />}

      <h1 className="text-white text-sm font-medium text-center px-3 break-words max-w-[90vw]">
        {userText ? userText : aiText ? aiText : null}
      </h1>
    </div>
  );
}

export default Home;

