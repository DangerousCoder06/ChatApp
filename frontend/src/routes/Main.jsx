import { useNavigate } from 'react-router-dom'
import { useEffect } from 'react'

const main = () => {
    const navigate = useNavigate()

    useEffect(() => {
        navigate("/home")
    },[])

}

export default main
