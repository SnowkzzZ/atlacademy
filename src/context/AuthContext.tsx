import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { User, Session } from '@supabase/supabase-js';

interface AuthContextType {
    user: User | null;
    session: Session | null;
    isLoading: boolean;
}

const AuthContext = createContext<AuthContextType>({ user: null, session: null, isLoading: true });

// Helper to create the master user mock
const createMasterUser = (): User => ({
    email: 'juliano.atl',
    id: 'admin-master',
    app_metadata: {},
    user_metadata: { full_name: 'Administrador Master' },
    aud: 'authenticated',
    created_at: new Date().toISOString(),
    role: 'authenticated',
    confirmed_at: new Date().toISOString(),
    last_sign_in_at: new Date().toISOString(),
    phone: '',
} as User);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const checkAuth = async () => {
        setIsLoading(true);
        try {
            // Priority 1: Master Local Bypass
            const isLocalBypass = localStorage.getItem('atl_admin_is_master') === 'true';
            if (isLocalBypass) {
                const masterUser = createMasterUser();
                setUser(masterUser);
                setSession({ user: masterUser, access_token: 'bypass', refresh_token: 'bypass', expires_in: 3600, token_type: 'bearer' } as Session);
                setIsLoading(false);
                return;
            }

            // Priority 2: Real Supabase Session
            const { data: { session: supabaseSession } } = await supabase.auth.getSession();
            setSession(supabaseSession);
            setUser(supabaseSession?.user ?? null);
        } catch (error) {
            console.error("Auth init error:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        checkAuth();

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, supabaseSession) => {
            const isLocalBypass = localStorage.getItem('atl_admin_is_master') === 'true';
            if (isLocalBypass) {
                const masterUser = createMasterUser();
                setUser(masterUser);
                setSession({ user: masterUser, access_token: 'bypass', refresh_token: 'bypass', expires_in: 3600, token_type: 'bearer' } as Session);
            } else {
                setSession(supabaseSession);
                setUser(supabaseSession?.user ?? null);
            }
            setIsLoading(false);
        });

        return () => subscription.unsubscribe();
    }, []);

    return (
        <AuthContext.Provider value={{ user, session, isLoading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    return useContext(AuthContext);
};
