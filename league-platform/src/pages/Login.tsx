import React, { useState } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { Mail, Lock, AlertCircle, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLogin } from "@workspace/api-client-react";
import { useAuth } from "@/hooks/use-auth";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  
  const loginMutation = useLogin();
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    try {
      const res = await loginMutation.mutateAsync({ data: { email, password } });
      login(res.token);
    } catch (err: any) {
      setErrorMsg(err.message || "Invalid credentials. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 relative z-10">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="w-full max-w-md"
        >
          <div className="mb-10">
            <h1 className="font-display text-4xl font-black text-white mb-2">Welcome Back</h1>
            <p className="text-muted-foreground">Enter your credentials to access your dashboard.</p>
          </div>

          {errorMsg && (
            <div className="mb-6 p-4 rounded-xl bg-destructive/10 border border-destructive/20 flex items-center gap-3 text-destructive">
              <AlertCircle size={20} />
              <span className="text-sm font-medium">{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-white/80 ml-1">Email Address</label>
              <Input 
                type="email" 
                required 
                placeholder="athlete@example.com" 
                value={email}
                onChange={e => setEmail(e.target.value)}
                icon={<Mail size={20} />}
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-white/80 ml-1">Password</label>
              <Input 
                type="password" 
                required 
                placeholder="••••••••" 
                value={password}
                onChange={e => setPassword(e.target.value)}
                icon={<Lock size={20} />}
              />
            </div>

            <Button 
              type="submit" 
              className="w-full" 
              size="lg"
              isLoading={loginMutation.isPending}
            >
              Sign In
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </form>

          <p className="mt-8 text-center text-muted-foreground">
            Don't have an account? <Link href="/register" className="text-primary hover:underline font-semibold">Create one</Link>
          </p>
        </motion.div>
      </div>

      {/* Right side - Image */}
      <div className="hidden lg:block lg:w-1/2 relative overflow-hidden">
        <img 
          src={`${import.meta.env.BASE_URL}images/auth-bg.png`}
          alt="Athletic texture"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/80 to-transparent" />
        <div className="absolute bottom-12 left-12 right-12 p-8 bg-black/40 backdrop-blur-md rounded-3xl border border-white/10">
          <h2 className="font-display text-3xl font-bold text-white mb-4">"The strength of the team is each individual member."</h2>
          <p className="text-primary font-medium tracking-wide uppercase text-sm">NEXPLAY Platform</p>
        </div>
      </div>
    </div>
  );
}
