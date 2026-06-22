import { useState } from "react";
import { Mail } from "lucide-react";
import { api } from "../services/api";

export function ForgotPasswordView() {
    const [email, setEmail] = useState("");
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
        try {
            setLoading(true);

            await api.auth.forgotPassword({ email });

            setMessage(
                "If an account exists, a reset link has been sent."
            );
        } catch {
            setMessage("Unable to send reset email.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-dark-100 flex items-center justify-center p-6">
            <div className="bg-dark-200 border border-dark-300 rounded-3xl p-8 w-full max-w-md">

                <div className="flex justify-center mb-4">
                    <Mail className="w-12 h-12 text-brand-green" />
                </div>

                <h1 className="text-2xl font-black text-center text-white">
                    Forgot Password
                </h1>

                <p className="text-center text-dark-500 text-sm mt-2">
                    Enter your email address to receive a reset link.
                </p>

                <input
                    type="email"
                    placeholder="Email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full mt-6 p-3 rounded-xl bg-dark-100 border border-dark-300 text-white"
                />

                <button
                    onClick={handleSubmit}
                    disabled={loading}
                    className="w-full mt-4 bg-brand-green text-dark-100 py-3 rounded-xl font-black"
                >
                    {loading ? "Sending..." : "Send Reset Link"}
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