import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface ProtectedRouteProps {
    children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
    const { user, isLoading } = useAuth();
    const location = useLocation();

    if (isLoading) {
        return (
            <div className="min-h-screen bg-[#030303] flex items-center justify-center">
                <div className="w-16 h-16 rounded-full border-t-2 border-primary border-r-2 animate-spin"></div>
            </div>
        );
    }

    if (!user) {
        // Redireciona para o login e salva a rota que o usuário tentou acessar
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    return <>{children}</>;
};
