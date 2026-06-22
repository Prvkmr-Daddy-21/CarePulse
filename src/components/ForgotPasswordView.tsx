import { useState } from "react";
import { api } from "../services/api";

export function ForgotPasswordView() {
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        setLoading(true);
        setError("");
        setMessage("");

        try {
            await api.auth.forgotPassword({
                email,
            });
        } catch (err: any) {
            setError(
                err?.response?.data?.message ||
                "Failed to send reset password email."
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#0D0F10] flex items-center justify-center px-4">
            <div className="w-full max-w-md bg-[#1A1D21] border border-[#2A2D31] rounded-2xl p-8">
                <h1 className="text-3xl font-bold text-white mb-2">
                    Forgot Password
                </h1>

                <p className="text-[#ABB8C4] mb-6">
                    Enter your email address and we'll send you a password reset link.
                </p>

                {message && (
                    <div className="mb-4 rounded-lg bg-green-500/10 border border-green-500/30 p-3 text-green-400">
                        {message}
                    </div>
                )}

                {error && (
                    <div className="mb-4 rounded-lg bg-red-500/10 border border-red-500/30 p-3 text-red-400">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <label className="block text-sm text-[#ABB8C4] mb-2">
                        Email Address
                    </label>

                    <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@example.com"
                        className="w-full px-4 py-3 rounded-xl bg-[#131619] border border-[#2A2D31] text-white outline-none focus:border-[#24AE77] mb-6"
                    />

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-[#24AE77] hover:bg-[#1e9a69] text-white py-3 rounded-xl font-semibold transition"
                    >
                        {loading ? "Sending..." : "Send Reset Link"}
                    </button>
                </form>
            </div>
        </div>
    );
}