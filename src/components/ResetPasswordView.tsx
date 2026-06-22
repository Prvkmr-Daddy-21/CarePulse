import { useState } from "react";
import { api } from "../services/api";

interface ResetPasswordViewProps {
    token: string;
    onNavigate: (view: string) => void;
}

export function ResetPasswordView({
    token,
    onNavigate,
}: ResetPasswordViewProps) {
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (password !== confirmPassword) {
            setError("Passwords do not match");
            return;
        }

        try {
            setLoading(true);
            setError("");

            await api.auth.resetPassword(token, {
                password,
            });

            setMessage(
                "Password reset successful. Redirecting to login..."
            );

            setTimeout(() => {
                window.history.pushState({}, "", "/");
                onNavigate("landing");
            }, 2000);
        } catch (err: any) {
            setError(
                err?.message ||
                "Failed to reset password."
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div
            style={{
                maxWidth: "450px",
                margin: "80px auto",
                padding: "24px",
            }}
        >
            <h1>Reset Password</h1>

            <form onSubmit={handleSubmit}>
                <input
                    type="password"
                    placeholder="New Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    style={{
                        width: "100%",
                        padding: "12px",
                        marginBottom: "12px",
                    }}
                />

                <input
                    type="password"
                    placeholder="Confirm Password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    style={{
                        width: "100%",
                        padding: "12px",
                        marginBottom: "12px",
                    }}
                />

                <button
                    type="submit"
                    disabled={loading}
                    style={{
                        width: "100%",
                        padding: "12px",
                    }}
                >
                    {loading ? "Resetting..." : "Reset Password"}
                </button>
            </form>

            {message && (
                <p style={{ color: "green" }}>{message}</p>
            )}

            {error && (
                <p style={{ color: "red" }}>{error}</p>
            )}
        </div>
    );
}