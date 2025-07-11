import jwt from "jsonwebtoken"
import dotenv from "dotenv"
dotenv.config()

const JWT_SECRET = process.env.JWT_SECRET

const Auth = async(req, res, next) => {
    const token = req.headers.authorization?.split(" ")[1]
    
    jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (err) {
            return res.status(401).send({error: "❌ Invalid token"})
        }

        req.user = decoded
        // console.log(decoded);
        next()
        
    })
}

export default Auth