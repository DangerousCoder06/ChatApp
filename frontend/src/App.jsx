import { Routes, Route } from "react-router-dom"
import Register from './routes/Register.jsx'
import Login from "./routes/Login.jsx"
import Home from './routes/Home.jsx'
import Main from './routes/Main.jsx'
import VideoCallPopup from "./routes/VideoCallPopup.jsx"

function App() {

  return (
    <>
      <Routes>
        <Route path='/register' element={<Register />}></Route>
        <Route path='/login' element={<Login />}></Route>
        <Route path='/home' element={<Home />}></Route>
        <Route path='/' element={<Main />}></Route>
        <Route path="/video-call" element={<VideoCallPopup />} />

        
      </Routes>
    </>
  )
}

export default App
