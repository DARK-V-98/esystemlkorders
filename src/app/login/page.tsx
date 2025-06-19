
"use client";

import { useState, useEffect, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import Image from 'next/image'; // Import next/image
import Link from 'next/link'; // Import Link

// Simple SVG for Google icon
const GoogleIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="24px" height="24px">
    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6.04C43.92 37.63 46.98 31.48 46.98 24.55z"/>
    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6.04c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
    <path fill="none" d="M0 0h48v48H0z"/>
  </svg>
);


export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const { signInWithGoogle, signInWithEmail, signUpWithEmail, user, loading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());

  useEffect(() => {
    setCurrentYear(new Date().getFullYear());
  }, []);

  useEffect(() => {
    if (!loading && user) {
      router.push('/menu'); 
    }
  }, [user, loading, router]);

  const handleEmailAuth = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (isSignUp) {
        await signUpWithEmail(email, password);
        toast({ title: "Signed Up", description: "Successfully created your account. Welcome!" });
      } else {
        await signInWithEmail(email, password);
        toast({ title: "Signed In", description: "Successfully signed in." });
      }
      router.push('/menu'); 
    } catch (error: any) {
      console.error(error);
      toast({
        variant: "destructive",
        title: isSignUp ? "Sign Up Failed" : "Sign In Failed",
        description: error.message || "An unknown error occurred.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsSubmitting(true);
    try {
      await signInWithGoogle();
      toast({ title: "Signed In", description: "Successfully signed in with Google." });
      router.push('/menu');
    } catch (error: any) {
      console.error(error);
       toast({
        variant: "destructive",
        title: "Google Sign In Failed",
        description: error.message || "Could not sign in with Google.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  if (loading || (!loading && user)) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-background to-muted/50 p-4">
      <Card className="w-full max-w-md shadow-2xl rounded-xl overflow-hidden">
        <CardHeader className="bg-primary/10 p-8 text-center">
          <div className="flex justify-center mb-4">
            <Image 
              src="/logo.png" 
              alt="eSystemLK Logo" 
              width={80} 
              height={80}
              priority 
              data-ai-hint="company logo"
            />
          </div>
          <CardTitle className="text-3xl font-bold text-primary">
            {isSignUp ? "Create Account" : "eSystemLK Gateway"}
          </CardTitle>
          <CardDescription className="text-center text-foreground/80 pt-1">
            {isSignUp ? "Enter your details to register." : "Sign in to access your dashboard."}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <form onSubmit={handleEmailAuth} className="space-y-4">
            <div>
              <Label htmlFor="email" className="text-foreground/90">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="mt-1"
                disabled={isSubmitting}
              />
            </div>
            <div>
              <Label htmlFor="password" className="text-foreground/90">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="mt-1"
                disabled={isSubmitting}
              />
            </div>
            <Button type="submit" className="w-full bg-accent hover:bg-accent/90 text-accent-foreground" disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {isSignUp ? "Sign Up" : "Sign In"}
            </Button>
          </form>
          
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Or continue with
              </span>
            </div>
          </div>

          <Button variant="outline" className="w-full border-input hover:bg-muted/50" onClick={handleGoogleSignIn} disabled={isSubmitting || isSignUp}>
             {isSubmitting && !isSignUp ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> :  <GoogleIcon /> }
            <span className="ml-2">Sign in with Google</span>
          </Button>
        </CardContent>
        <CardFooter className="p-6 bg-muted/30 flex flex-col items-center space-y-2">
           <Button variant="link" onClick={() => setIsSignUp(!isSignUp)} className="text-sm text-accent hover:text-accent/80 p-0 h-auto" disabled={isSubmitting}>
            {isSignUp ? "Already have an account? Sign In" : "Don't have an account? Sign Up"}
          </Button>
           <p className="text-xs text-muted-foreground text-center w-full pt-2">
            &copy; {currentYear} eSystemLK. All rights reserved.
           </p>
           <p className="text-xs text-muted-foreground text-center w-full">
            Powered by <Link href="https://www.esystemlk.xyz" target="_blank" rel="noopener noreferrer" className="hover:underline text-accent">www.esystemlk.xyz</Link>
           </p>
        </CardFooter>
      </Card>
    </div>
  );
}

    