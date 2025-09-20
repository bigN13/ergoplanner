'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { useLoginMutation } from '@/api/authApi';
import { setAuth, selectIsAuthenticated, selectAuthError } from '@/store/slices/authSlice';
import { addToast } from '@/store/slices/uiSlice';
import { Button, Card, TextInput, Label, Checkbox } from 'flowbite-react';
import { Eye, EyeOff, Mail, Lock, ArrowRight } from 'lucide-react';
import { config, routes } from '@/config';
import type { LoginCredentials } from '@/types';

// Validation schema
const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),
  password: z
    .string()
    .min(1, 'Password is required')
    .min(6, 'Password must be at least 6 characters'),
  rememberMe: z.boolean().optional(),
});

type LoginFormData = z.infer<typeof loginSchema>;

const LoginPage: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dispatch = useAppDispatch();
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const [showPassword, setShowPassword] = useState(false);
  const [login, { isLoading }] = useLoginMutation();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
      rememberMe: false,
    },
  });

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      const redirect = searchParams.get('redirect') || routes.dashboard;
      router.push(redirect);
    }
  }, [isAuthenticated, router, searchParams]);

  const onSubmit = async (data: LoginFormData) => {
    try {
      const response = await login(data).unwrap();

      // Store auth data in Redux
      dispatch(setAuth(response));

      // Show success message
      dispatch(addToast({
        type: 'success',
        title: 'Welcome back!',
        message: 'You have been successfully signed in.',
        autoClose: true,
      }));

      // Redirect to intended page or dashboard
      const redirect = searchParams.get('redirect') || routes.dashboard;
      router.push(redirect);

    } catch (error: any) {
      // Handle different error types
      if (error.status === 401) {
        setError('email', { message: 'Invalid email or password' });
        setError('password', { message: 'Invalid email or password' });
      } else if (error.status === 423) {
        setError('email', { message: 'Account is locked. Please try again later.' });
      } else if (error.data?.errors) {
        // Handle validation errors from server
        Object.entries(error.data.errors).forEach(([field, messages]) => {
          if (Array.isArray(messages) && messages.length > 0) {
            setError(field as keyof LoginFormData, { message: messages[0] });
          }
        });
      } else {
        dispatch(addToast({
          type: 'error',
          title: 'Sign in failed',
          message: error.data?.message || 'An unexpected error occurred. Please try again.',
          autoClose: true,
        }));
      }
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 to-blue-800 dark:from-blue-800 dark:to-blue-900">
        <div className="flex flex-col justify-center px-12 text-white">
          <div className="mb-8">
            <img
              src={config.app.logo}
              alt={config.app.name}
              className="h-12 w-auto mb-6"
            />
            <h1 className="text-4xl font-bold mb-4">{config.app.name}</h1>
            <p className="text-xl text-blue-100">
              Advanced P&ID management system with AI-driven design assistance
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                <ArrowRight className="h-4 w-4" />
              </div>
              <span>Collaborative drawing environment</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                <ArrowRight className="h-4 w-4" />
              </div>
              <span>Automated Bill of Quantities generation</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                <ArrowRight className="h-4 w-4" />
              </div>
              <span>AI-powered design validation</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Login form */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="lg:hidden mb-6">
              <img
                src={config.app.logo}
                alt={config.app.name}
                className="h-10 w-auto mx-auto"
              />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
              Welcome back
            </h2>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Sign in to your account to continue
            </p>
          </div>

          <Card>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Email field */}
              <div>
                <Label htmlFor="email" value="Email address" />
                <div className="relative mt-1">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <TextInput
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    className="pl-10"
                    color={errors.email ? 'failure' : 'gray'}
                    helperText={errors.email?.message}
                    {...register('email')}
                  />
                </div>
              </div>

              {/* Password field */}
              <div>
                <Label htmlFor="password" value="Password" />
                <div className="relative mt-1">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <TextInput
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    className="pl-10 pr-10"
                    color={errors.password ? 'failure' : 'gray'}
                    helperText={errors.password?.message}
                    {...register('password')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Remember me and forgot password */}
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Checkbox
                    id="rememberMe"
                    {...register('rememberMe')}
                  />
                  <Label htmlFor="rememberMe" className="ml-2 text-sm">
                    Remember me
                  </Label>
                </div>

                <Link
                  href={routes.forgotPassword}
                  className="text-sm text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
                >
                  Forgot password?
                </Link>
              </div>

              {/* Submit button */}
              <Button
                type="submit"
                className="w-full"
                disabled={isLoading}
                isProcessing={isLoading}
                processingSpinner={<div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />}
              >
                {isLoading ? 'Signing in...' : 'Sign in'}
              </Button>
            </form>

            {/* Sign up link */}
            <div className="text-center mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Don't have an account?{' '}
                <Link
                  href={routes.register}
                  className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
                >
                  Sign up here
                </Link>
              </p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;