import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';

interface ProtectedRouteProps {
    children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
    const [isChecking, setIsChecking] = useState(true);
    const [isAllowed, setIsAllowed] = useState(false);

    useEffect(() => {
        const checkIP = async () => {
            const allowedIP = import.meta.env.VITE_ALLOWED_ADMIN_IP;
            
            try {
                // Fetch public IP of the user
                const response = await fetch('https://api.ipify.org?format=json');
                const data = await response.json();
                
                // If it matches the allowed IP, or if it hasn't been configured yet (dev mode fallback)
                if (data.ip === allowedIP || !allowedIP || allowedIP === "COLOQUE_O_SEU_IP_AQUI") {
                     setIsAllowed(true);
                } else {
                     setIsAllowed(false);
                }
            } catch (err) {
                console.error("IP Check Failed", err);
                setIsAllowed(false);
            } finally {
                setIsChecking(false);
            }
        };
        
        checkIP();
    }, []);

    if (isChecking) {
        return (
            <div className="min-h-screen bg-[#030303] flex items-center justify-center flex-col gap-4">
                <div className="w-16 h-16 rounded-full border-t-2 border-primary border-r-2 animate-spin"></div>
                <p className="text-white/40 text-sm font-label uppercase tracking-widest">Verificando Acesso de Rede...</p>
            </div>
        );
    }

    if (!isAllowed) {
        // Redireciona para a Home se o IP for diferente
        return <Navigate to="/" replace />;
    }

    return <>{children}</>;
};
