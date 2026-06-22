import { useState } from "react";
import { Lock } from "lucide-react";
import { api } from "../services/api";
import { Eye, EyeOff, ArrowLeft } from "lucide-react";

interface Props {
    token: string;
    onNavigate: (view: string) => void;
}

export function ResetPasswordView({
    token,
    onNavigate,
}: Props) {
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [message, setMessage] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const handleReset = async () => {
        if (password !== confirmPassword) {
            setMessage("❌ Passwords do not match");
            return;
        }
        if (password.length < 6) {
            setMessage("❌ Password must be at least 6 characters");
            return;
        }

        try {
            await api.auth.resetPassword(token, {
                password,
            });

            setMessage("✅ Password reset successful! Redirecting to login...");

            setTimeout(() => {
                window.location.href = "/";
            }, 2000);

        } catch {
            setMessage("❌ Invalid or expired token");
        }
    };
    return (
        <div className="min-h-screen bg-dark-100 flex items-center justify-center p-6 relative">
            {/* Back to Home Button */}
            <button
                onClick={() => onNavigate("landing")}
                className="absolute top-6 left-6 z-50 text-xs text-gray-150 hover:text-white flex items-center gap-1.5 bg-dark-200 border border-dark-300 px-3 py-1.5 rounded-xl transition-colors cursor-pointer"
            >
                <ArrowLeft className="w-3.5 h-3.5" />
                Back to Home
            </button>

            <div className="bg-dark-200 border border-dark-300 rounded-3xl p-8 w-full max-w-md">

                <div className="flex justify-center mb-4">
                    <Lock className="w-12 h-12 text-brand-green" />
                </div>

                <h1 className="text-2xl font-black text-white text-center">
                    Reset Password
                </h1>

                <div className="space-y-4 mt-6">

                    <div className="relative">
                        <input
                            type={showPassword ? "text" : "password"}
                            placeholder="New Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full p-3 rounded-xl bg-dark-100 border border-dark-300 text-white pr-12"
                        />

                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                        >
                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                    </div>

                    <div className="relative">
                        <input
                            type={showConfirmPassword ? "text" : "password"}
                            placeholder="Confirm Password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="w-full p-3 rounded-xl bg-dark-100 border border-dark-300 text-white pr-12"
                        />

                        <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                        >
                            {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                    </div>

                </div>

                <button
                    onClick={handleReset}
                    className="w-full mt-4 bg-brand-green text-dark-100 py-3 rounded-xl font-black"
                >
                    Reset Password
                </button>

                {message && (
                    <p className="mt-4 text-center text-sm text-brand-green">
                        {message}
                    </p>
                )}

            </div>

        </div>
    );
}