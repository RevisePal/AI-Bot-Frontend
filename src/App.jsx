import React from "react";
import { useState, useEffect } from "react";
import "./App.css";
import send from "./assets/send.png";
import robot from "./assets/robot.png";
import student from "./assets/student.jpg";
import loadingGif from "./assets/loading.gif";
// import { url } from './utils/utils';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCopy, faCheck } from "@fortawesome/free-solid-svg-icons";

function App() {
  const [prompt, updatePrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(null); // null indicates nothing is copied
  const [conversation, setConversation] = useState([]);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const question = urlParams.get("question");
    updatePrompt(question || ""); // Use empty string if question is null
  }, []);

  const handleCopyClick = (text, index) => {
    navigator.clipboard.writeText(text);
    setCopied(index); // Pass the index of the copied message
    setTimeout(() => setCopied(null), 1000); // Reset the copied state after 1 second
  };

  function stripHtmlTags(html) {
    const doc = new DOMParser().parseFromString(html, "text/html");
    return doc.body.textContent || "";
  }

  const sendPrompt = async (event) => {
    if (event.key !== "Enter" || prompt.trim() === "") {
      return;
    }

    // Prepare the conversation history for the backend
    // Assuming the backend expects an array of {role, content} objects
    const conversations = conversation
      .map((conv) => ({
        role: "user",
        content: conv.prompt,
      }))
      .concat({
        role: "assistant",
        content: prompt, // The current prompt being sent
      });

    try {
      setLoading(true);

      const requestOptions = {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversations }),
      };

      const res = await fetch(
        `https://ai-bot-backend.onrender.com/ask`,
        requestOptions
      );

      if (!res.ok) {
        throw new Error("Something went wrong");
      }

      const { message } = await res.json();
      setConversation([...conversation, { prompt, response: message }]);
      updatePrompt("");
    } catch (err) {
      console.error(err, "err");
    } finally {
      setLoading(false);
    }
  };

  const handleIconClick = () => {
    if (!loading) {
      sendPrompt({ key: "Enter" });
    }
  };

  return (
    <div className="flex flex-col items-center justify-start w-screen pt-10 text-center overflow-auto min-h-screen bg-gradient-to-b from-blue-700 to-blue-400">
      <h1 className="text-white w-full text-4xl font-sans">
        Welcome to TutorGPT
      </h1>
      <h2 className="text-white w-full text-base font-light font-sans">
        Powered by GPT-4
      </h2>
      {/* Use flex-grow to make this div take up all available space, pushing the input box to the bottom */}
      <div
        className="flex-grow w-10/12 flex flex-col items-center justify-end"
        style={{ paddingBottom: "6rem" }}
      >
        <div
          className="w-full flex flex-col-reverse overflow-y-auto bg-transparent"
          style={{ maxHeight: "calc(100vh - 12rem)" }}
        >
          {conversation
            .slice()
            .reverse()
            .map((item, index) => (
              <div key={index}>
                <div
                  className="message user-message"
                  style={{ marginBottom: "1rem", textAlign: "left" }}
                >
                  <div className="avatar-and-text flex flex-row">
                    <img
                      className="bot-avatar"
                      src={student}
                      alt="robot avatar"
                    />
                    <p
                      style={{
                        color: "#333",
                        fontFamily: "Arial, sans-serif",
                        fontSize: "1rem",
                        lineHeight: "1.5",
                        fontWeight: "700",
                      }}
                    >
                      {stripHtmlTags(item.prompt)}
                    </p>
                  </div>
                </div>

                <div className="message bot-message">
                  <div className="avatar-and-text flex flex-row">
                    <img
                      className="bot-avatar"
                      src={robot}
                      alt="robot avatar"
                    />
                    <p>
                      {index === 0 && loading ? (
                        <img
                          style={{ height: "20px", marginLeft: "10px" }}
                          src={loadingGif}
                          alt="loading"
                        />
                      ) : (
                        item.response
                      )}
                    </p>
                  </div>
                  {copied === index ? (
                    <FontAwesomeIcon
                      className="hover: bg-gray-300"
                      icon={faCheck}
                      onClick={() => handleCopyClick(item.response, index)}
                    />
                  ) : (
                    <FontAwesomeIcon
                      className="hover:cursor-pointer p-2 hover:bg-gray-300"
                      icon={faCopy}
                      onClick={() => handleCopyClick(item.response, index)}
                    />
                  )}
                </div>
              </div>
            ))}
        </div>
      </div>
      {/* Input box fixed at the bottom */}
      <div className="fixed bottom-0 left-5 right-5 p-4 bg-transparent mt-4">
        <div className="relative rounded-lg ">
          <textarea
            className="flex-grow rounded-lg pl-2.5 pr-12 py-2 focus:outline-none text-sm md:text-base w-full min-h-15 resize-none"
            placeholder="Ask TutorGTP..."
            disabled={loading}
            value={stripHtmlTags(prompt)}
            onChange={(e) => updatePrompt(e.target.value)}
            onKeyDown={(e) => sendPrompt(e)}
            style={{ paddingRight: "2rem" }}
          />

          <img
            className="absolute right-2 bottom-6 w-8 h-8 cursor-pointer bg-transparent"
            src={send}
            alt="send icon"
            onClick={handleIconClick}
          />
        </div>
      </div>
    </div>
  );
}

export default App;
