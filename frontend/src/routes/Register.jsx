import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { FaEyeSlash } from "react-icons/fa";
import { IoIosEye } from "react-icons/io";
import { useNavigate } from "react-router-dom";
import "./register.css"
import { Link } from 'react-router-dom';


const Register = () => {
  const navigate = useNavigate();
  const [err, seterr] = useState("")

  
  const API_URL = import.meta.env.VITE_API_URL

  const [showPassword, setshowPassword] = useState(false)
  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting }

  } = useForm()

  const username = watch("username")

  useEffect(() => {
    if(err){
      seterr("")
    }
  
  }, [username])

  const handlePassClick = () => {
    setshowPassword(!showPassword)
  }

  const onSubmit = async (data) => {  
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);

  const {username, password} = data

  try {
    const res = await fetch(`${API_URL}/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
      signal: controller.signal
    });
    
    
    
    if (res.status === 200) {
      // const { token } = await res.json();
      // localStorage.setItem("token", token);
      navigate("/login");
      localStorage.setItem("username", username);
      reset()
    } else {
      const e = await res.json()
      seterr(e.error)
    }
    clearTimeout(timeout);

  } catch (error) {
    if (error.name === "AbortError") {
      alert("⏰ Request timed out. Please try again");
    } else {
      alert("❌ Something went wrong. Please try again later");
    }
  }
};


  return (
    <div className="container register min-w-screen h-screen flex justify-center items-center">
      <div className="form bg-white max-w-[350px] min-h-[400px] rounded-[20px] shadow-2xl p-6 flex flex-col items-center">
        <div className='header mx-1 w-[250px] sm:w-[280px]'>
          <h1 className='text-3xl font-bold my-1'>Sign Up</h1>
          <h4>ConnectHub - Real-Time Video Calling & Chat App</h4>
        </div>
        <form className=' flex flex-col items-center gap-[20px] my-6' action="" onSubmit={handleSubmit(onSubmit)}>
          <div className='flex flex-col items-start'>
            <input type="text" {...register("username", { required: { value: true, message: "* This field is required" }, pattern: { value: /^[a-zA-Z0-9_]+$/, message: "Only letters, numbers, and underscores are allowed" }, minLength: { value: 4, message: "Must contain atleast 4 characters" }, maxLength: { value: 12, message: "Cannot exceed 12 characters" } })} placeholder='Enter username' />
            {errors.username && <div className='text-red-600 text-sm'>{errors.username.message}</div>}
            {<div className='text-red-600 text-sm'>{err}</div>}

          </div>
          <div className='relative flex flex-col items-start'>
            <input className='password' {...register("password", { required: { value: true, message: "* This field is required" }, validate: {
                hasLower: (value) =>
                  /[a-z]/.test(value) || "Must include a lowercase letter",
                hasUpper: (value) =>
                  /[A-Z]/.test(value) || "Must include an uppercase letter",
                hasNumber: (value) =>
                  /\d/.test(value) || "Must include a number",
                hasSpecial: (value) =>
                  /[^A-Za-z0-9]/.test(value) || "Must include a special character",
                minLength: (value) =>
                  value.length >= 6 || "Password must be at least 6 characters",
                maxLength: (value) =>
                  value.length <= 16 || "Password must be at most 16 characters",
              } })} type={showPassword ? "text" : "password"} placeholder="Password" />
            <button type="button" className='password cursor-pointer' onClick={handlePassClick}>{showPassword ? <IoIosEye /> : <FaEyeSlash />}</button>
            {errors.password && <div className='text-red-600 relative text-sm'>{errors.password.message}</div>}
          </div>

          <button className='submit my-5 bg-blue-600 text-white font-bold text-xl w-[290px] rounded-4xl h-[55px]' type='submit' disabled={isSubmitting}>Sign Up</button>
          {isSubmitting && <div>Creating user...</div>}

        </form>
        <div className='text-sm relative bottom-[20px]'>
            <span>Already a user? </span>
            <Link to="/login" className='underline text-blue-600'>Sign In</Link>
        </div>
      </div>
    </div>
  )
}

export default Register