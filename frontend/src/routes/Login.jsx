import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { FaEyeSlash } from "react-icons/fa";
import { IoIosEye } from "react-icons/io";
import { useNavigate } from "react-router-dom";
import "./login.css"
import { Link } from 'react-router-dom';


const Login = () => {
  const navigate = useNavigate();

  const API_URL = import.meta.env.VITE_API_URL

  useEffect(() => {
    async function verify() {
      const token = localStorage.getItem("token")

      if (token) {
        let res = await fetch(`${API_URL}/verify`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        })
        
        if (res.status === 200) {
          navigate("/home")
        }
      }
    }

    verify()

  }, [])


  const [showPassword, setshowPassword] = useState(false)
  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting }

  } = useForm()

  const handlePassClick = () => {
    setshowPassword(!showPassword)
  }


  const onSubmit = async (data) => {

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    const { username, password } = data

    try {
      const res = await fetch(`${API_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        signal: controller.signal
      });

      clearTimeout(timeout);

      if (res.status === 401) {
        const e = await res.json()
        alert(e.error);
        return;
      }
      
      if (res.status === 403) {
        alert("You are banned")
        return;
      }
      const { token } = await res.json();
      localStorage.setItem("token", token);
      localStorage.setItem("username", username);
      navigate("/home");
      reset()


    } catch (err) {
      if (err.name === "AbortError") {
        alert("⏰ Request timed out. Plese try again")
      }
      else {
        alert("❌ Something went wrong. Please try again later")
      }
    }
  };


  return (
    <div className="container login min-w-screen h-screen flex justify-center items-center">
      <div className="form bg-white max-w-[350px] min-h-[400px] rounded-[20px] shadow-2xl p-6 flex flex-col items-center">
        <div className='header mx-1 w-[250px] sm:w-[280px]'>
          <h1 className='text-3xl font-bold my-1'>Sign In</h1>
          <h4>ConnectHub - Real-Time Video Calling & Chat App</h4>
        </div>
        <form className=' flex flex-col items-center gap-[20px] my-6' action="" onSubmit={handleSubmit(onSubmit)}>
          <div>
            <input className='input' type="text" {...register("username", { required: { value: true, message: "* This field is required" } })} placeholder='Enter username' />
            {errors.username && <div className='text-red-600 text-sm'>{errors.username.message}</div>}

          </div>
          <div className='relative'>
            <input className='password input' {...register("password", {
              required: { value: true, message: "* This field is required" }
            })} type={showPassword ? "text" : "password"} placeholder="Password" />
            <button type="button" className='password cursor-pointer' onClick={handlePassClick}>{showPassword ? <IoIosEye /> : <FaEyeSlash />}</button>
            {errors.password && <div className='text-red-600 relative left-[8px] text-sm'>{errors.password.message}</div>}
          </div>

          <button className='submit my-5 bg-blue-600 text-white font-bold text-xl w-[290px] rounded-4xl h-[55px]' type='submit' disabled={isSubmitting}>Sign In</button>
          {isSubmitting && <div>Verifying...</div>}

        </form>
        <div className='text-sm relative bottom-[20px]'>
          <span>New user? </span>
          <Link to="/register" className='underline text-blue-600'>Sign Up</Link>
        </div>
      </div>
    </div>
  )
}

export default Login