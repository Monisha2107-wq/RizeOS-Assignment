import React, { useState } from 'react'; //
import { useNavigate, Link } from 'react-router-dom';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { Loader2, Eye, EyeOff } from 'lucide-react'; //
import { toast } from 'sonner';

import api from '../api/axios';
import { useAuthStore } from '../store/authStore';

// Shadcn UI
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

const registerSchema = z.object({
  name: z.string().min(2, "Organization name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function Register() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);
  const [showPassword, setShowPassword] = useState(false); //

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: '', email: '', password: '' },
  });

  const registerMutation = useMutation({
    mutationFn: async (data: RegisterFormValues) => {
      const response = await api.post('/auth/register', data);
      return response.data.data;
    },
    onSuccess: (data) => {
      setAuth(data.token, data.organization, data.employee);
      navigate('/dashboard');
      toast.success('Workspace created successfully!');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || err.response?.data?.errors?.[0]?.message || 'Registration failed.');
    }
  });

  const onSubmit = (data: RegisterFormValues) => {
    registerMutation.mutate(data);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md shadow-lg border-border">
        <CardHeader className="text-center space-y-2">
          <CardTitle className="text-3xl font-bold tracking-tight">Create Workspace</CardTitle>
          <CardDescription>Start managing your workforce intelligently</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField control={form.control} name="name" render={({ field }) => (
                <FormItem>
                  <FormLabel>Organization Name</FormLabel>
                  <FormControl><Input placeholder="Stark Industries" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="email" render={({ field }) => (
                <FormItem>
                  <FormLabel>Admin Email</FormLabel>
                  <FormControl><Input placeholder="tony@stark.com" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="password" render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <div className="relative"> {/* */}
                    <FormControl>
                      <Input 
                        type={showPassword ? "text" : "password"} //
                        placeholder="••••••••" 
                        className="pr-10" //
                        {...field} 
                      />
                    </FormControl>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent text-muted-foreground"
                      onClick={() => setShowPassword((prev) => !prev)} //
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" /> //
                      ) : (
                        <Eye className="h-4 w-4" /> //
                      )}
                    </Button>
                  </div>
                  <FormMessage />
                </FormItem>
              )} />

              <Button type="submit" className="w-full mt-2" disabled={registerMutation.isPending}>
                {registerMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {registerMutation.isPending ? 'Creating...' : 'Create Workspace'}
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex justify-center border-t pt-6 bg-muted/20">
          <p className="text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link to="/login" className="text-primary font-medium hover:underline">
              Sign In
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}