import React, { useState } from 'react'


const App = () => {

  const [title, setTitle] = useState('')
  const [details, setDetails] = useState('')
  const [task, setTask] = useState([])

  const submitHandler = (e)=>{
    e.preventDefault()
    const copyTask = [...task]
    copyTask.push({title, details})

    

    setTask(copyTask)
    setTitle('')
    setDetails('')

    
  }
  const deleteNote = (idx) => {
    const copyTask = [...task];
   copyTask.splice(idx,1)
   setTask(copyTask)
    

  }

  return (
    <div className='h-screen lg:flex bg-black text-white '>
      
      <form onSubmit={(e)=>{submitHandler(e)}} className='flex gap-4 lg:w-1/2 items-start p-10 flex-col'>
        <h1 className='text-4xl font-bold'>Add Notes</h1>


        <input className='px-5 w-full py-2 font-medium outline-none border-2 rounded'
          type="text" 
          placeholder='Enter Notes Heading' 
          value={title} 
          onChange={(e)=>{ 
            setTitle(e.target.value)
          }}
        />


        <textarea className='px-5 w-full font-medium outline-none flex items-start h-32 py-2 border-2 rounded'
          placeholder='Enter Details' name="" id="" 
          value={details}
          onChange={(e)=>{
            setDetails(e.target.value)
          }}
          ></textarea>
        
        <button
          className='bg-white outline-none w-full text-black px-5 py-2 rounded active:scale-95' 
        >Add Note</button>
    
        
      </form>
      <div className='lg:w-1/2 flex-wrap p-10 '>
      <h1 className='text-4xl font-bold'>Recent Notes</h1>
        <div className='flex flex-wrap items-start justify-start gap-5 mt-5 h-[90%] overflow-auto '>
          {task.map(function(elem, idx){
            return <div key={idx} className='flex justify-between flex-col 
            items-start relative h-52 w-40 text-black overflow-hidden py-9 px-4 rounded-2xl bg-cover 
            bg-[url("https://static.vecteezy.com/system/resources/previews/037/152/677/non_2x/sticky-note-paper-background-free-png.png")]'>
            <div>
              <h3 className='leading-tight text-lg font-bold'>{elem.title}</h3>
              <p className='mt-3 leading-tight font-semibold text-gray-700'>{elem.details}</p>
            </div>

            <button onClick={()=>{
              deleteNote(idx)
            }} className='w-full bg-red-500 cursor-pointer active:scale-95 
            text-white py-1 text-xs rounded font-bold'>Delete</button>
          </div>
          })}
          
          
        </div>
      </div>
    </div>
  )
}

export default App