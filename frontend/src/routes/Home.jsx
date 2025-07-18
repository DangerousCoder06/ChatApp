import React from "react";
import { useNavigate } from "react-router-dom"
import { useEffect, useState, useRef } from "react"
import { io } from "socket.io-client"
import { v4 as uuidv4 } from 'uuid'
import "./home.css"
import { RxHamburgerMenu } from "react-icons/rx";
import { IoArrowBackOutline } from "react-icons/io5";
import { FaBan } from "react-icons/fa";
import { PiChatSlashFill } from "react-icons/pi";
import { MdDarkMode } from "react-icons/md";
import { IoVideocamSharp } from "react-icons/io5";
import { IoLogOutOutline } from "react-icons/io5";
import IncomingCallModal from "../components/IncomingCallModal";
import { createSocket } from "../utils/socket";
import { MdLightMode } from "react-icons/md";
import { TbReload } from "react-icons/tb";
import { AiFillDelete } from "react-icons/ai";


const Home = () => {
  const username = localStorage.getItem("username")
  const API_URL = import.meta.env.VITE_API_URL
  const navigate = useNavigate()

  const socket = useRef()

  const textareaRef = useRef(null)
  const textarea = textareaRef.current;
  const [isOpen, setisOpen] = useState(false)
  const [allUsers, setAllUsers] = useState([])
  const [onlineUsers, setOnlineUsers] = useState([])
  const [searchValue, setSearchValue] = useState("")
  const [incomingCall, setIncomingCall] = useState(null)
  const [hasRendered, setHasRendered] = useState(null)


  const isTabActiveRef = useRef(document.visibilityState === "visible")

  useEffect(() => {
    const handleVisibilityChange = () => {
      const isVisible = document.visibilityState === "visible"
      isTabActiveRef.current = isVisible

      if (isVisible) {

        setMessages(prevMessages => {
          const updatedMessages = prevMessages.map(m => {
            if (m.status === "delivered" && m.sender != username) {
              const seenMsg = { ...m, status: "seen" }
              socket.current.emit("status", seenMsg)
              return seenMsg
            }
            return m;
          });
          return updatedMessages
        });
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange)
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange)
    };
  }, []);

  const [messages, setMessages] = useState([])
  const [isTyping, setIsTyping] = useState();
  const containerRef = useRef();

  const settimeoutRef = useRef(null)
  const audioRef = useRef()


  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      container.scrollTo({
        top: container.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [messages.length]);

  useEffect(() => {
    if (localStorage.getItem("message")) {
      const chat = JSON.parse(localStorage.getItem("message"))
      setMessages(chat)
    }

    socket.current = createSocket()
    socket.current.emit("user-connected", { username, from: "chat", token: localStorage.getItem("token") })

    socket.current.on("show-typing", (username) => {
      setIsTyping(username);
      setTimeout(() => setIsTyping(null), 1500)
    })

    socket.current.on('connect', () => {

      setMessages(prevMessages => {
        const updatedMessages = prevMessages.map(msg => {
          if (msg.status === "pending" && msg.sender === username) {
            socket.current.emit("user-message", { ...msg, status: "sent" });
            return { ...msg, status: "sent" };
          }
          return msg;
        });
        return updatedMessages;
      });
    })

    socket.current.on("message", (msg) => {

      if (username != msg.sender) {
        if (isTabActiveRef.current) {
          msg.status = "seen"
        }
        else {
          msg.status = "delivered"
        }
        socket.current.emit('status', msg)
        setMessages(messages => [...messages, msg])

      }

    });
    socket.current.on('userside-chat', msg => {
      setMessages(messages => messages.map(m =>
        m.id === msg.id ? { ...m, status: msg.status } : m
      )
      );
    })

    socket.current.on("user-online", (joinedUser) => {
      if (joinedUser === username)
        return;
      setMessages(prevMessages => {
        const undeliveredMessages = prevMessages.filter(
          message => message.status === "sent" && message.sender === username
        );
        undeliveredMessages.forEach(message => {
          socket.current.emit("user-message", message)
        });

        return prevMessages;
      });
    });

    socket.current.on("user-list", ({ allUsers, onlineUsers }) => {
      setAllUsers(allUsers)
      setOnlineUsers(onlineUsers)
      setHasRendered(true)
    })


    socket.current.on('joined', (message) => {
      setMessages(messages => [...messages, message])
    })

    socket.current.on('left', (message) => {
      setMessages(messages => [...messages, message])
    })

    socket.current.on("mute-status-updated", ({ username, isMuted, mutedBy }) => {
      setAllUsers(prevUsers =>
        prevUsers.map(user =>
          user.username === username ? { ...user, isMuted, mutedBy } : user
        )
      );
      if (username === localStorage.getItem("username")) {
        setMuted(isMuted)
      }
    });

    socket.current.on("mute-status", ({ isMuted }) => {
      setMuted(isMuted)
    })

    socket.current.on("ban-status-updated", ({ username, isBanned, bannedBy }) => {
      setAllUsers(prevUsers =>
        prevUsers.map(user =>
          user.username === username ? { ...user, isBanned, bannedBy } : user
        )
      );

      if (username === localStorage.getItem("username")) {
        if (isBanned === true) {
          navigate("/login")
          localStorage.removeItem("token")
          alert(`You have been banned by ${bannedBy}`)
        }
      }

    })

    socket.current.on("incoming-call", async ({ callId, caller }) => {
      setIncomingCall({ callId, caller });
      settimeoutRef.current = setTimeout(() => {
        setIncomingCall(null)
        socket.current.emit("timeOut")
      }, 20000);

    })

    socket.current.on("incoming-null", () => {
      if (audioRef.current) {
        audioRef.current.pause()
      }
      setIncomingCall(null)
      clearTimeout(settimeoutRef.current)
    })

    socket.current.on("content-loaded", () => {
      setIsLoaded(true)
    })


    return () => {
      socket.current.off("incoming-call")
      socket.current.off("message")
      socket.current.off("joined")
      socket.current.off("left")
      socket.current.off("user-online")
      socket.current.off("connect")
      socket.current.off("user-list")
      socket.current.off("show-typing")
      socket.current.off("mute-status-updated")
      socket.current.off("ban-status-updated")
      socket.current.off("incoming-null")
      socket.current.off("content-loaded")
    }

  }, [])

  const [muted, setMuted] = useState(null)
  const [isLoaded, setIsLoaded] = useState(false)

  if (incomingCall && audioRef.current) {
    audioRef.current.play()
  }


  useEffect(() => {
    localStorage.setItem("message", JSON.stringify(messages))
  }, [messages])


  const [value, setValue] = useState("")

  const handleChange = (e) => {
    setValue(e.target.value.trim())
    socket.current.emit("typing", username)
    textarea.style.height = "auto"
    textarea.style.height = `${textarea.scrollHeight}px`
  }

  const handleClick = () => {

    const sendMessage = {
      id: uuidv4(),
      sender: username,
      message: value,
      date: new Date(Date.now()).toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' }),
      time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false }),
      status: "sent"
    }

    if (value.trim() != "") {
      if (socket.current.connected) {
        socket.current.emit("user-message", sendMessage)
        setMessages(messages => [...messages, sendMessage])
      } else {
        setMessages(messages => [...messages, { ...sendMessage, status: "pending" }])
      }

      setValue("")

    }
  }

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleClick()
    }
  }


  useEffect(() => {

    async function verifyImmediately() {

      const token = localStorage.getItem("token")

      if (!token) {
        navigate("/login")
      }

      let res = await fetch(`${API_URL}/verify`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })

      if (res.status === 401) {
        clearInterval(interval)
        navigate("/login")
        localStorage.removeItem("token")
        return;
      }

    }
    verifyImmediately()

    const interval = setInterval(verifyImmediately, 1000);
  }, [])

  const SingleTick = ({ color = "#999" }) => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path d="M4 12l6 6L20 6" stroke={color} strokeWidth="2" />
    </svg>
  )

  const DoubleTick = ({ color = "#999" }) => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path d="M2 12l5 5L18 4" stroke={color} strokeWidth="2" />
      <path d="M7 12l5 5L22 4" stroke={color} strokeWidth="2" />
    </svg>
  )

  const Pending = () => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#FF0000"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>

  )

  const DoubleBlueTick = () => (
    <DoubleTick color="#0A84FF" />
  );

  const handleSearch = (e) => {
    setSearchValue(e.target.value)
  }

  const isAdmin = useRef(false)

  useEffect(() => {
    if (allUsers.length != 0) {
      const currentUser = allUsers.find(u => u.username === username)
      localStorage.setItem("currentUser", JSON.stringify(currentUser))
      if (currentUser.role === "admin") {
        isAdmin.current = true
      } else {
        isAdmin.current = false
      }
    }

  }, [allUsers, username])

  const current = JSON.parse(localStorage.getItem("currentUser"))

  const handleMute = (targetUser) => {
    socket.current.emit("toggle-mute", { targetUsername: targetUser.username, by: username })
  }

  const handleBan = (targetUser) => {
    socket.current.emit("toggle-ban", { targetUsername: targetUser.username, by: username })
  }

  const [theme, setTheme] = useState(localStorage.getItem("theme"))

  const toggleDark = () => {
    document.body.classList.toggle("dark-mode")
    localStorage.setItem("theme", document.body.classList.contains("dark-mode") ? "light" : "dark")
    setTheme(`${localStorage.getItem("theme")} mode`)
  }

  useEffect(() => {
    if (localStorage.getItem("theme") === "light") {
      document.body.classList.add("dark-mode")
    }
  }, [])

  const handleVideoCall = async (user) => {
    const userId = username
    const callId = `${userId}-${user.username}-${uuidv4()}`

    const popup = window.open(
      `/video-call?callId=${callId}&caller=${userId}&callee=${user.username}`,
      "_blank",
      "width=700,height=500"
    )
    socket.current.emit("incoming-call", { callId, caller: userId, callee: user.username })

  }

  return (
    <div>
      {isLoaded &&
        <div className="relative">
          {incomingCall && (
            <IncomingCallModal
              caller={incomingCall.caller}
              onAccept={() => {
                if (audioRef.current) {
                  audioRef.current.pause()
                }
                const popup = window.open(
                  `/video-call?callId=${incomingCall.callId}&caller=${incomingCall.caller}&callee=${username}`,
                  "_blank",
                  "width=700,height=500"
                );

                clearTimeout(settimeoutRef.current)
                setIncomingCall(null)

              }}
              onReject={() => {
                if (audioRef.current) {
                  audioRef.current.pause()
                }
                setIncomingCall(null)
                clearTimeout(settimeoutRef.current)
                socket.current.emit("call-rejected", username)
              }}
            />
          )}

          <div className={`sideBar fixed h-full top-0 left-0 w-[300px] bg-white shadow-xl z-50 transform transition-transform duration-250 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full'} rounded-r-sm overflow-y-auto`}>

            <button onClick={() => setisOpen(false)} className="p-2 m-3 rounded-full hover:bg-gray-100 transition" title="Back">
              <IoArrowBackOutline className="icon" size={20} />
            </button>

            <div className="px-4 relative">

              <div className="flex justify-between items-end font-semibold mb-6 border-b pb-2 text-gray-700 sideHeader">
                <h1 className="text-3xl">Users</h1>
                <button onClick={() => { localStorage.removeItem("token"); socket.current.disconnect() }} title="Logout">
                  <IoLogOutOutline className="icon" size={20} />
                </button>
              </div>


              <input onChange={handleSearch} value={searchValue} className="searchBar mb-[15px]" type="text" placeholder="🔍 Search users..." />
              <span className="flex items-center">
                <span className="animate-pulse w-4 h-4 rounded-full ml-[6px] bg-green-500"></span>
                <span>
                  <pre> Online{`(${[... new Set(onlineUsers)].length})`}</pre>
                </span>
              </span>
              <div className="overflow-y-auto pr-1 mt-5 flex-1">
                {hasRendered &&
                  <ul className="space-y-3 flex-1 flex-col">
                    <div>
                      {[...new Set(allUsers)]
                        .filter(user => user.username === username)
                        .filter(user => {
                          const lowerSearch = searchValue.toLowerCase();
                          const isOnline = onlineUsers.includes(user);

                          if (lowerSearch === "online") return isOnline;
                          if (lowerSearch === "offline") return !isOnline;
                          return [...lowerSearch].every(char =>
                            user.username.toLowerCase().includes(char)
                          );
                        })
                        .map(user => (
                          <li key={uuidv4()} className="flex sideList items-center gap-2 py-2 rounded-md my-2">
                            <span className={`w-3 h-3 ml-2 my-2 rounded-full ${onlineUsers.includes(user.username) ? "bg-green-500" : "bg-gray-400"}`}></span>
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm font-bold uppercase">
                                {user.username.charAt(0)}
                              </div>
                              <span className={`font-semibold ${user.role === "admin" ? "text-red-600" : ""}`}>
                                {`${user.username} (You)`}
                              </span>
                            </div>
                          </li>
                        ))}

                      {[...new Set(allUsers)]
                        .filter(user => user.username != username)
                        .filter(user => {
                          const lowerSearch = searchValue.toLowerCase();
                          const isOnline = onlineUsers.includes(user.username);

                          if (lowerSearch === "online") return isOnline;
                          if (lowerSearch === "offline") return !isOnline;
                          return [...lowerSearch].every(char =>
                            user.username.toLowerCase().includes(char)
                          );
                        })
                        .map(user => (
                          <li key={uuidv4()} className="sideList flex items-center gap-2 py-2 rounded my-1">
                            <span className={`w-3 h-3 ml-2 my-2 rounded-full ${onlineUsers.includes(user.username) ? "bg-green-500" : "bg-gray-400"}`}></span>
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm font-bold uppercase">
                                {user.username && user.username.charAt(0)}
                              </div>
                              <span className={`${user.role === "admin" ? "text-red-600" : ""}`}>
                                {user.username}
                              </span>
                            </div>
                            <div className="admin flex gap-[15px] ml-auto pr-2">
                              <button onClick={() => handleVideoCall(user)} title="VideoCall">
                                <IoVideocamSharp className="icon" />
                              </button>
                              {isAdmin.current &&
                                <div className="flex items-center gap-[15px]">
                                  <button onClick={() => handleMute(user)} title="Mute">
                                    <PiChatSlashFill className="icon" color={user.isMuted ? "red" : ""} />
                                  </button>
                                  <button onClick={() => handleBan(user)} title="Ban">
                                    <FaBan className="icon" color={user.isBanned ? "red" : ""} />
                                  </button>
                                </div>
                              }
                            </div>
                          </li>
                        ))}
                    </div>
                  </ul>
                }
              </div>
            </div>
          </div>

          <div className="chat-window w-full" onClick={() => { isOpen ? setisOpen(false) : "" }}>

            {(current && !muted) &&

              <div className="message-input">
                <textarea className="chat-input resize-none" onKeyDown={handleKeyDown} ref={textareaRef} value={value} onChange={handleChange} rows={1} placeholder="Type a message" />
                <button className="send-btn" onClick={handleClick}>Send</button>
              </div>
            }
            {(current && muted) &&

              <div className="message-input justify-center">
                <span className="muteMessage">You have been muted by <span className="font-bold text-red-600">{localStorage.getItem("mutedBy")}</span></span>
              </div>
            }

            <div ref={containerRef} className="messages-container">

              {messages.map((item, index) => {
                const showDate = index === 0 || messages[index - 1].date !== item.date;
                return (

                  <React.Fragment key={item.id}>
                    {showDate && (
                      <div className="flex justify-center">
                        <span className="text-xs text-gray-500 my-2 bg-white px-2 py-1 inline-block rounded shadow-sm">{item.date}</span>
                      </div>
                    )}

                    {item.type === "join" || item.type === "left" ? (

                      <div className="flex justify-center my-2">
                        <span className="text-xs italic text-gray-500 bg-white px-2 py-1 rounded shadow-sm">
                          {item.type === "join" && item.sender === username ? "You joined the chat" : item.message}
                        </span>
                      </div>) : (

                      <div className={item.sender === username ? "message sent" : "message received"}>
                        <div className="text-sm text-blue-500 font-bold">
                          {!(item.sender === username) && item.sender}
                        </div>

                        <div className="user-message flex items-end justify-between flex-wrap">
                          {item.message}
                        </div>

                        <div className="text-[10px] flex justify-end time">
                          <span className="text-xs time relative">
                            {item.time}
                          </span>
                          {item.sender === username &&
                            (
                              <>
                                <span className="status">
                                  {item.status === "seen" && <DoubleBlueTick />}
                                  {item.status === "sent" && <SingleTick />}
                                  {item.status === "delivered" && <DoubleTick />}
                                </span>
                                <span className="relative top-[2px]">
                                  {item.status === "pending" && <Pending />}
                                </span>
                              </>

                            )}
                        </div>

                      </div>
                    )}

                  </React.Fragment>
                )
              })}


              {isTyping && (
                <div className="typing-indicator text-sm text-gray-500 mb-2 px-4">
                  {isTyping} is typing
                  <span className="dot-anim ml-1">.</span>
                  <span className="dot-anim">.</span>
                  <span className="dot-anim">.</span>
                </div>
              )}

            </div>

            <nav className="navbar flex justify-between items-center sticky top-0">
              <button title="Users" onClick={() => setisOpen(true)} className="hamBurger cursor-pointer p-3 rounded-full hover:bg-gray-100"><RxHamburgerMenu className="icon" strokeWidth={0.5} /></button>
              <div>
                {socket.current && socket.current.connected ?
                  <span className="flex justify-center items-center px-3 text-[16px] font-semibold relative left-[25px]">
                    <span className="flex items-center">

                      <span className="text-base animate-pulse w-4 h-4 rounded-full bg-green-500"></span>
                      <span className={document.body.classList.contains("dark-mode") ? "text-white" : "text-black"}>
                        Online
                      </span>
                    </span>
                  </span> : (
                    <div className="relative left-[25px]">
                      <span className="flex justify-center items-center px-3 text-[16px] font-semibold">
                        <span className="text-base animate-pulse w-4 h-4 rounded-full bg-red-500"></span>
                        <span className={document.body.classList.contains("dark-mode") ? "text-white" : "text-black"}>
                          Offline
                        </span>
                      </span>
                      <div className="text-xs text-red-600 mt-1 ml-2">Please check your connection</div>
                    </div>
                  )
                }
              </div>
              <div>
                <button className="p-2 rounded-full hover:bg-gray-100 transition-all duration-200" title="clear chat" onClick={() => { setMessages([]) }}>
                  <AiFillDelete className="icon" />
                </button>
                <button className="p-2 rounded-full hover:bg-gray-100 transition-all duration-200" title={theme} onClick={toggleDark}>
                  {document.body.classList.contains("dark-mode") ? <MdLightMode className="icon" size={17} /> : <MdDarkMode className="icon" />}
                </button>
                <button className="p-2 rounded-full hover:bg-gray-100 transition-all duration-200" title="refresh" onClick={() => { window.location.reload() }}>
                  <TbReload className="icon" strokeWidth={2.5} />
                </button>
              </div>
            </nav>
          </div>
          <audio src="/ringtone.mp3" ref={audioRef}></audio>
        </div>
      }
    </div>

  )
}

export default Home