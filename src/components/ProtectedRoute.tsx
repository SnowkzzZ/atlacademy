import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';

interface ProtectedRouteProps {
    children: React.ReactNode;
}

// IPs autorizados a acessar a Central de Comando
const ALLOWED_IPS: string[] = [
    '179.101.159.181',
];

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
    const [isChecking, setIsChecking] = useState(true);
    const [isAllowed, setIsAllowed] = useState(false);

    useEffect(() => {
        const checkIP = async () => {
            try {
                const response = await fetch('https://api.ipify.org?format=json');
                const data = await response.json();
                setIsAllowed(ALLOWED_IPS.includes(data.ip));
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
        return <Navigate to="/" replace />;
    }

    return <>{children}</>;
};
