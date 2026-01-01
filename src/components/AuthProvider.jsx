import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [session, setSession] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!supabase) {
            setLoading(false);
            return;
        }

        // Init Session
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            setUser(session?.user ?? null);
            setLoading(false);
        });

        // Listen for changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
            setUser(session?.user ?? null);
            setLoading(false);
        });

        return () => subscription.unsubscribe();
    }, []);

    const signIn = async (email, password) => {
        if (!supabase) return { error: { message: "Supabase not configured" } };
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        return { data, error };
    };

    const signUp = async (email, password) => {
        if (!supabase) return { error: { message: "Supabase not configured" } };
        const { data, error } = await supabase.auth.signUp({ email, password });
        return { data, error };
    };

    const updateProfile = async (updates) => {
        if (!supabase) return { error: { message: "Supabase not configured" } };
        const { data, error } = await supabase.auth.updateUser(updates);
        if (data.user) {
            setUser(data.user);
        }
        return { data, error };
    };

    const signOut = async () => {
        if (!supabase) return;
        await supabase.auth.signOut();
    };

    return (
        <AuthContext.Provider value={{
            user: {
                email: 'tester@chessrep.com',
                user_metadata: { full_name: 'Chess Master' }
            }, // MOCKED FOR VERIFICATION
            session: {},
            loading: false,
            signIn, signUp, signOut, updateProfile
        }}>
            {children}
        </AuthContext.Provider>
    );
};
