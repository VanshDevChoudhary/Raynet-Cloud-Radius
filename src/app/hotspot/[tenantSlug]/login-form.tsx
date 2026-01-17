"use client";

import { useState } from "react";

interface HotspotLoginFormProps {
  tenantSlug: string;
  enableUserPass: boolean;
  enableOtp: boolean;
  enableVoucher: boolean;
  termsOfService: string | null;
  redirectUrl: string | null;
  primaryColor: string;
}

type LoginMethod = "userpass" | "otp" | "voucher";

export function HotspotLoginForm({
  tenantSlug,
  enableUserPass,
  enableOtp,
  enableVoucher,
  termsOfService,
  redirectUrl,
  primaryColor,
}: HotspotLoginFormProps) {
  const methods: { key: LoginMethod; label: string; enabled: boolean }[] = [
    { key: "userpass", label: "Username", enabled: enableUserPass },
    { key: "otp", label: "OTP", enabled: enableOtp },
    { key: "voucher", label: "Voucher", enabled: enableVoucher },
  ];

  const enabledMethods = methods.filter((m) => m.enabled);
  const [activeMethod, setActiveMethod] = useState<LoginMethod>(
    enabledMethods[0]?.key || "userpass"
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(!termsOfService);

  // Username/password state
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // OTP state
  const [phone, setPhone] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState("");

  // Voucher state
  const [voucherCode, setVoucherCode] = useState("");

  const handleUserPassLogin = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/hotspot/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenantSlug, method: "userpass", username, password }),
      });
      const data = await res.json();
      if (data.success) {
        if (redirectUrl) {
          setSuccess(`Welcome, ${data.name}! Redirecting...`);
          setTimeout(() => (window.location.href = redirectUrl), 2000);
        } else {
          setSuccess(`Welcome, ${data.name}! You are now connected.`);
        }
      } else {
        setError(data.error || "Login failed");
      }
    } catch {
      setError("Connection error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSendOtp = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/hotspot/otp/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenantSlug, phone }),
      });
      const data = await res.json();
      if (data.success) {
        setOtpSent(true);
      } else {
        setError(data.error || "Failed to send OTP");
      }
    } catch {
      setError("Connection error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/hotspot/otp/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenantSlug, phone, code: otpCode }),
      });
      const data = await res.json();
      if (data.success) {
        if (redirectUrl) {
          setSuccess("OTP verified! Redirecting...");
          setTimeout(() => (window.location.href = redirectUrl), 2000);
        } else {
          setSuccess("OTP verified! You are now connected.");
        }
      } else {
        setError(data.error || "Invalid OTP");
      }
    } catch {
      setError("Connection error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleVoucherLogin = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/hotspot/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenantSlug, method: "voucher", voucherCode }),
      });
      const data = await res.json();
      if (data.success) {
        if (redirectUrl) {
          setSuccess(`Voucher activated! Plan: ${data.plan}. Redirecting...`);
          setTimeout(() => (window.location.href = redirectUrl), 2000);
        } else {
          setSuccess(`Voucher activated! Plan: ${data.plan}. You are now connected.`);
        }
      } else {
        setError(data.error || "Invalid voucher");
      }
    } catch {
      setError("Connection error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="rounded-lg bg-green-50 p-6 text-center">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
          <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <p className="font-medium text-green-800">{success}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Login method tabs */}
      {enabledMethods.length > 1 && (
        <div className="flex rounded-lg bg-gray-100 p-1">
          {enabledMethods.map((m) => (
            <button
              key={m.key}
              onClick={() => { setActiveMethod(m.key); setError(""); }}
              className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                activeMethod === m.key
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Username/Password form */}
      {activeMethod === "userpass" && (
        <div className="space-y-3">
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Username"
            className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="w-full rounded-lg border border-gray-300 px-4 py-3 pr-12 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showPassword ? (
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
              ) : (
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
              )}
            </button>
          </div>
        </div>
      )}

      {/* OTP form */}
      {activeMethod === "otp" && (
        <div className="space-y-3">
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Phone number (e.g., +919876543210)"
            disabled={otpSent}
            className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-50"
          />
          {otpSent && (
            <input
              type="text"
              value={otpCode}
              onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder="Enter 6-digit OTP"
              maxLength={6}
              className="w-full rounded-lg border border-gray-300 px-4 py-3 text-center text-lg font-bold tracking-widest text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          )}
        </div>
      )}

      {/* Voucher form */}
      {activeMethod === "voucher" && (
        <div className="space-y-3">
          <input
            type="text"
            value={voucherCode}
            onChange={(e) => setVoucherCode(e.target.value.toUpperCase())}
            placeholder="Enter voucher code"
            className="w-full rounded-lg border border-gray-300 px-4 py-3 text-center text-lg font-bold tracking-wider text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
      )}

      {/* Terms checkbox */}
      {termsOfService && (
        <label className="flex items-start gap-2">
          <input
            type="checkbox"
            checked={acceptedTerms}
            onChange={(e) => setAcceptedTerms(e.target.checked)}
            className="mt-1 h-4 w-4 rounded border-gray-300"
          />
          <span className="text-xs text-gray-500">
            I accept the{" "}
            <button
              type="button"
              onClick={() => alert(termsOfService)}
              className="text-blue-600 underline"
            >
              Terms of Service
            </button>
          </span>
        </label>
      )}

      {/* Submit button */}
      <button
        onClick={() => {
          if (activeMethod === "userpass") handleUserPassLogin();
          else if (activeMethod === "otp") {
            if (otpSent) handleVerifyOtp();
            else handleSendOtp();
          } else if (activeMethod === "voucher") handleVoucherLogin();
        }}
        disabled={loading || !acceptedTerms}
        style={{ backgroundColor: primaryColor }}
        className="w-full rounded-lg px-4 py-3 text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {loading
          ? "Please wait..."
          : activeMethod === "userpass"
            ? "Connect"
            : activeMethod === "otp"
              ? otpSent
                ? "Verify OTP"
                : "Send OTP"
              : "Activate Voucher"}
      </button>
    </div>
  );
}
