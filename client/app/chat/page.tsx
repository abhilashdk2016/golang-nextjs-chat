'use client';
import ChatBody from '@/components/chat_body';
import { API_URL } from '@/contants';
import { AuthContext } from '@/modules/auth_provider';
import { WebSocketContext } from '@/modules/websocket_provider';
import autosize from 'autosize';
import { useRouter } from 'next/navigation';
import React, { useState, useRef, useContext, useEffect } from 'react';

export type Message = {
    content: string
    client_id: string
    username: string
    room_id: string
    type: "recv" | "self"
}

const ChatPage = () => {
    const [ messages, setMessages] = useState<Array<Message>>([]);
    const [ users, setUsers] = useState<Array<{ username: string }>>([]);
    const textarea = useRef<HTMLTextAreaElement>(null);
    const { conn } = useContext(WebSocketContext);
    const { user } = useContext(AuthContext);
    const router = useRouter();

    const sendMessage = (e: React.SyntheticEvent) => {
        e.preventDefault();
        if(!textarea.current?.value) return;
        if(conn == null) {
            router.push('/');
            return;
        }
        conn.send(textarea.current.value);
        textarea.current.value = '';
    }

    useEffect(() => {
        if(conn == null) {
            router.push('/');
            return;
        }
        const roomId = conn.url.split('/')[5];
        async function getUsers() {
            try {
                const res = await fetch(`${API_URL}/ws/getClients/${roomId}`, {
                    method: 'GET',
                    headers: { 'Content-Type': 'application/json'}
                });
                const data = await res.json();
                setUsers(data);
            } catch (error) {
                console.log(error);
            }
        }
        getUsers();
    }, []); // get clients in the room

    useEffect(() => {
        if(textarea.current) {
            autosize(textarea.current);
        }

        if(conn == null) {
            router.push('/');
            return;
        }

        conn.onmessage = (message) => {
            const m = JSON.parse(message.data);
            if(m.content == 'A new user has joined the room') {
                setUsers([...users, { username: m.username }]);
            }if(m.content == 'User left the chat') {
                const deleteUser = users.filter(user => user.username != m.username);
                setUsers([...deleteUser]);
                setMessages([...messages, m]);
                return
            }

            user?.username == m.username ? (m.type = 'self') : (m.type = 'recv');
            setMessages([...messages, m]);
        }

        conn.onclose = () => {}
        conn.onerror = () => {}
        conn.onopen = () => {}
    }, [textarea, messages, conn, users]); // handle websocket connections
  return <>
    <div className='flex flex-col w-full'>
        <div className='p-4 md:mx-6 mb-14'>
            <ChatBody data={messages} />
        </div>
        <div className='fixed bottom-2 mt-4 w-full'>
            <div className='flex md:flex-row px-4 py-2 bg-grey md:mx-4 rounded-md'>
                <div className='flex w-full mr-4 rounded-md order border-blue'>
                    <textarea ref={textarea}
                        className='w-full h-10 p-2 rounded-md focus:outline-none'
                        placeholder='type your message'
                        style={{ resize : 'none'}}
                    ></textarea>
                </div>
                <div className='flex items-center' >
                    <button className='p-2 rounded-md bg-blue text-white' onClick={sendMessage}>Send</button>
                </div>
            </div>
        </div>
    </div>
  </>
}

export default ChatPage