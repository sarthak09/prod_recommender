import React, { useState, useRef, useEffect } from "react";
import "./Recommender.css";

//const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";
const API_BASE_URL = window.location.origin;  // Uses current host
const Recommender = () => {
  const [messages, setMessages] = useState([
    {
      id: 1,
      role: "assistant",
      text: "Hi! I’m your recommender. Ask me a question based on the documents I’ve been trained on 👋",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const sendMessage = async () => {
    const trimmed = input.trim();
    if (!trimmed || loading) return;

    setErrorMsg("");

    const userMessage = {
      id: Date.now(),
      role: "user",
      text: trimmed,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
//      const res = await fetch(`${API_BASE_URL}/recommender`, {
        const res = await fetch(`${API_BASE_URL}/recommender`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ input_: trimmed }),
      });

      if (!res.ok) {
        throw new Error(`Backend returned status ${res.status}`);
      }

      const data = await res.json();

      let botText;
      if (data.status === "success") {
        if (typeof data.response === "string") {
          botText = data.response;
        } else {
          botText = JSON.stringify(data.response, null, 2);
        }
      } else {
        botText =
          data.message || "I couldn't generate a response. Please try again.";
      }

      const botMessage = {
        id: Date.now() + 1,
        role: "assistant",
        text: botText,
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (err) {
      console.error(err);
      setErrorMsg("Could not reach the backend. Check if Flask is running.");
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 2,
          role: "assistant",
          text:
            "There was a problem contacting the server. Please make sure the backend is running on http://localhost:5000.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    sendMessage();
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="recommender-container">
      {/* Just title */}
      <h2 className="recommender-title">Recommender Chat</h2>

      {/* Chat area */}
      <div className="recommender-chat-window">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`chat-row ${
              msg.role === "user" ? "chat-row-user" : "chat-row-assistant"
            }`}
          >
            <div
              className={`chat-bubble ${
                msg.role === "user"
                  ? "chat-bubble-user"
                  : "chat-bubble-assistant"
              }`}
            >
              <div className="chat-meta">
                {msg.role === "user" ? "You" : "Assistant"}
              </div>
              <div className="chat-text">
                {msg.text.split("\n").map((line, idx) => (
                  <p key={idx}>{line}</p>
                ))}
              </div>
            </div>
          </div>
        ))}

        {loading && (
          <div className="chat-row chat-row-assistant">
            <div className="chat-bubble chat-bubble-assistant">
              <div className="chat-meta">Assistant</div>
              <div className="chat-text">
                <p>Thinking…</p>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {errorMsg && <div className="recommender-error">{errorMsg}</div>}

      {/* Input */}
      <form className="recommender-input-bar" onSubmit={handleSubmit}>
        <textarea
          className="recommender-textarea"
          rows={2}
          placeholder="Type your question here… (Enter to send, Shift+Enter for new line)"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={loading}
        />
        <div className="recommender-actions">
          <button
            type="submit"
            className="recommender-send-button"
            disabled={loading || !input.trim()}
          >
            {loading ? "Sending…" : "Send"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default Recommender;
