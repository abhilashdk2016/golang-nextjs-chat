'use client';
import { useRouter } from 'next/navigation';
import React, { createContext, useEffect, useState } from 'react';

export type UserInfo = {
    username: string
    id: string
}

export type AUthContextProps = {
    authenticated: boolean,
    setAuthenticated: (auth: boolean) => void,
    user: UserInfo,
    setUser: (user: UserInfo) => void
}

export const AuthContext = createContext<AUthContextProps>({
    authenticated: false,
    setAuthenticated: () => {},
    user: { username: '', id: '' },
    setUser: () => {}
})

const AuthContextProvider = ({ children } : { children: React.ReactNode }) => {
  const [authenticated, setAuthenticated] = useState(false);
  const [user, setUser] = useState<UserInfo>({ username: '', id: '' });
  const router = useRouter();
  useEffect(() => {
    const userInfo = localStorage.getItem('user_info');

    if(!userInfo) {
        if(window.location.pathname != '/signup') {
            router.push('/login');
            return;
        }
    } else {
        const user: UserInfo = JSON.parse(userInfo);
        if(user) {
            setUser({
                username: user.username,
                id: user.id
            })
        }
        setAuthenticated(true);
    }
  }, [authenticated])

  return <AuthContext.Provider value={{
    authenticated,
    setAuthenticated,
    user,
    setUser
  }}>
    {children}
  </AuthContext.Provider>
}

export default AuthContextProvider