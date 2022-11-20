import React, { useState, useEffect, useRef } from "react";
import styled from "styled-components";
import ChatInput from "./ChatInput";
import moment from "moment"
import Logout from "./Logout";
import { v4 as uuidv4 } from "uuid";
import axios from "axios";
import { sendMessageRoute, recieveMessageRoute } from "../utils/APIRoutes";

export default function ChatContainer({ currentChat,socket,contactHandler,onlineUsers}) {
  const [messages, setMessages] = useState([]);
  const scrollRef = useRef();
  const [arrivalMessage, setArrivalMessage] = useState(null);

useEffect(async () => {
    const data = await JSON.parse(
      localStorage.getItem(process.env.REACT_APP_LOCALHOST_KEY)
    );
    const response = await axios.post(recieveMessageRoute, {
      from: data._id,
      to: currentChat._id,
    });
    let filter=groupByDate(response.data)
    setMessages(filter);
  }, [currentChat]);

  useEffect(() => {
    const getCurrentChat = async () => {
      if (currentChat) {
        await JSON.parse(
          localStorage.getItem(process.env.REACT_APP_LOCALHOST_KEY)
        )._id;
      }
    };
    getCurrentChat();
  }, [currentChat]);

  const handleSendMsg = async (msg) => {
    const data = await JSON.parse(
      localStorage.getItem(process.env.REACT_APP_LOCALHOST_KEY)
    );
    let d=await axios.post(sendMessageRoute,{
      from:data._id,
      to: currentChat._id,
      message:msg,
    });
    socket.current.emit("send-msg",{
      to: currentChat._id,
      from: data._id,
      data:d?.data
    });
    contactHandler({to: currentChat._id,
      from: data._id,
      data:d?.data,
      fromSelf: true})
    const msgs = [...messages];
    msgs[msgs.length-1]?.messages?.push({ fromSelf: true,message:msg ,createdAt:d.data.data?.createdAt});
    setMessages(msgs);
  };

  useEffect(() => {
    if(socket.current){
      socket.current.on("msg-recieve",(msg)=>{
        contactHandler({ to: currentChat._id,
          from: msg?.data?.data._id,
          data:msg?.data,
          fromSelf: false})
        setArrivalMessage({fromSelf:false,message:msg?.data?.data?.message?.text,createdAt:msg?.data?.data?.createdAt});
      });
      
    }
  }, []);

  useEffect(() => {
    // arrivalMessage && setMessages((prev) => [...prev, arrivalMessage]);
    const msgs = [...messages];
    // console.log(arrivalMessage)
    // if(arrivalMessage?.to===currentChat?._id){
      msgs[msgs.length-1]?.messages?.push({fromSelf:false,message:arrivalMessage?.message,
        createdAt:arrivalMessage?.createdAt });
      setMessages(msgs);
    // }
  }, [arrivalMessage]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior:"smooth"});
  }, [messages]);
//=======================================day grouping ==================================
  function groupByDate(arr){
    // this gives an object with dates as keys
const groups = arr.reduce((groups, game) => {
  const date = game.createdAt.split('T')[0];
  if (!groups[date]) {
    groups[date] = [];
  }
  groups[date].push(game);
  return groups;
}, {});

// Edit: to add it in the array format instead
const groupArrays = Object.keys(groups).map((date)=>{
  return {
    date,
    messages:groups[date]
  };
});
  return groupArrays;
  }
//==============filter=========
  function dateDiff(date){
 var dateofvisit = moment(date, 'YYYY-MM-DD');
var today = moment();
let d=today?.diff(dateofvisit,'days');
 if(d===0) return "Today";
 else if(d===1) return "Yesterday";
 else return date;
  }
  return (
    <Container>
      <div className="chat-header">
        <div className="user-details">
          <div className="avatar">
            <img
              src={`data:image/svg+xml;base64,${currentChat.avatarImage}`}
              alt=""
            />
          </div>
          <div className="username">
            <h3>{currentChat.username}</h3>
            <span>{onlineUsers.includes(currentChat?._id)?'Online':'Offline'}</span>
          </div>
        </div>
        <Logout />
      </div>
      <div className="chat-messages">
        {messages.map((msg) =>{
          return (
            <div ref={scrollRef} key={uuidv4()}>
              <p style={{color:'white'}}>{dateDiff(msg?.date)}</p>
              {
                msg.messages?.map(message=>(
              <div
                className={`message ${
                  message?.fromSelf ? "sended":"recieved"
                }`}
                key={message?.createdAt}
              >
                <div className="content">
                  <p>{message?.message}</p>
                  <p>{moment(message?.createdAt).format("hh:mm:A")}</p>
                </div>
              </div>))}
            </div>
          );
        })}
      </div>
      <ChatInput handleSendMsg={handleSendMsg}/>
    </Container>
  );
}

const Container = styled.div`
  display: grid;
  grid-template-rows: 10% 80% 10%;
  gap: 0.1rem;
  overflow: hidden;
  @media screen and (min-width: 720px) and (max-width: 1080px) {
    grid-template-rows: 15% 70% 15%;
  }
  .chat-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0 2rem;
    .user-details {
      display: flex;
      align-items: center;
      gap: 1rem;
      .avatar {
        img {
          height: 3rem;
        }
      }
      .username {
        h3 {
          color: white;
        }
      }
    }
  }
  .chat-messages {
    padding: 1rem 2rem;
    display: flex;
    flex-direction: column;
    gap: 1rem;
    overflow: auto;
    &::-webkit-scrollbar {
      width: 0.2rem;
      &-thumb {
        background-color:white;
        width: 0.1rem;
        border-radius: 1rem;
      }
    }
    .message {
      display: flex;
      align-items: center;
      .content {
        max-width: 40%;
        overflow-wrap: break-word;
        padding: 1rem;
        font-size: 1.1rem;
        border-radius: 1rem;
        color: black;
        @media screen and (min-width: 720px) and (max-width: 1080px) {
          max-width: 70%;
        }
      }
    }
    .sended {
      justify-content: flex-end;
      .content {
        background-color: white;
      }
    }
    .recieved {
      justify-content: flex-start;
      .content {
        background-color: white;
      }
    }
  }
`;
