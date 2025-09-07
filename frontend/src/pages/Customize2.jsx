import React, { useContext, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { userDataContext } from '../context/UserContext';
import axios from 'axios';
import { MdArrowBack } from "react-icons/md";

function Customize2() {
    const {userData,backendImage,selectedImage,serverUrl,setUserData} = useContext(userDataContext);
    const [assistantname,setAssistantName] = useState(userData?.assistantname || "");
    const [loading,setLoading] = useState(false);
    const navigate = useNavigate();
    const handleUpdateAssistant = async ()=>{
        setLoading(true);
        try {
            let formData = new FormData()
            formData.append("assistantName",assistantname)
            if(backendImage){
                formData.append("assistantImage",backendImage)
            }else{
                formData.append("imageUrl",selectedImage);
            }
            const result = await axios.post(`${serverUrl}/api/user/update`,formData,{withCredentials:true});

            console.log(result.data);
            setUserData(result.data);
            setLoading(false);

        } catch (error) {
            setLoading(false);
            console.log(error);
        }
    }
  return (
    <div className='w-full h-[100vh] bg-gradient-to-t from-[black] to-[#030353] flex justify-center items-center flex-col p-[20px] relative'>
        <MdArrowBack className='absolute top-[30px] left-[30px] text-white w-[25px] h-[25px] cursor-pointer' onClick={()=>{navigate("/customize")}}/>
        <h1 className='text-white text-[30px] text-center mb-[40px]'>Enter Your <span className='text-blue-200'>Assistant Name</span></h1>
         <input type="text" placeholder='eg : Sifra ' className='w-full max-w-[600px] h-[60px] outline-none 
                    border-2 border-white bg-transparent text-white placeholder-gray-300 
                    px-[20px] py-[10px] rounded-full text-[18px]' required onChange={(e)=>setAssistantName(e.target.value)} value={assistantname}/>
       {assistantname && <button className='min-w-[300px] h-[60px] bg-white rounded-full mt-[30px] text-black 
        font-semibold text-[19px] cursor-pointer' disabled={loading} onClick={()=>{navigate("/"),handleUpdateAssistant()}} > {!loading?"Finally create your assistant":"Loading....."} </button>}

    </div>
  )
}

export default Customize2
