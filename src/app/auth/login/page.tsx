'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Scissors, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
// import { createClient } from '@/lib/supabase/client'; // Assuming this exists

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast.error('Please enter both email and password');
      return;
    }

    setIsLoading(true);

    try {
      // Mocking supabase login for now since client is not fully setup
      // const supabase = createClient();
      // const { data, error } = await supabase.auth.signInWithPassword({
      //   email,
      //   password,
      // });
      
      // if (error) throw error;
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast.success('Successfully logged in');
      router.push('/dashboard');
      router.refresh();
    } catch (error: any) {
      toast.error(error.message || 'Failed to login');
      console.error('Login error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="flex flex-col items-center space-y-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="bg-primary p-2 rounded-xl text-primary-foreground shadow-[0_0_15px_rgba(212,164,55,0.3)]">
              <Scissors className="h-8 w-8" />
            </div>
            <span className="font-bold text-3xl tracking-tight text-foreground">RJ BARBER</span>
          </Link>
          <p className="text-muted-foreground">Staff Portal Login</p>
        </div>

        <Card className="border-border/50 shadow-lg bg-card/50 backdrop-blur-sm">
          <CardHeader className="space-y-1 text-center pb-8">
            <CardTitle className="text-2xl">Welcome back</CardTitle>
            <CardDescription>
              Enter your credentials to access the admin dashboard
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleLogin}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="admin@rjbarbersalon.com" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                  required
                  className="bg-background/50"
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  <Link 
                    href="/auth/forgot-password" 
                    className="text-sm font-medium text-primary hover:underline"
                  >
                    Forgot password?
                  </Link>
                </div>
                <Input 
                  id="password" 
                  type="password" 
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  required
                  className="bg-background/50"
                />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col pt-6">
              <Button 
                type="submit" 
                className="w-full font-bold text-md h-12" 
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  'Sign In'
                )}
              </Button>
            </CardFooter>
          </form>
        </Card>
        
        <div className="text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} RJ Barber Salon. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
}
