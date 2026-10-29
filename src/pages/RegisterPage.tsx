import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { 
  Sparkles, 
  ArrowRight, 
  Lock, 
  Mail, 
  User, 
  Building, 
  Eye, 
  EyeOff, 
  CheckCircle2, 
  Briefcase, 
  UserCheck, 
  ShieldCheck,
  Quote,
  Loader2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { UserRole } from '../types';
import { getPasswordStrength } from '../utils/formatters';

export function RegisterPage() {
  const [searchParams] = useSearchParams();
  const initialRole: UserRole = searchParams.get('role') === 'admin' || searchParams.get('role') === 'recruiter' ? 'admin' : 'user';

  const [role, setRole] = useState<UserRole>(initialRole);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [company, setCompany] = useState('');
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [loading, setLoading] = useState(false);

  const { registerUser } = useAuth();
  const { success, error: showError } = useToast();
  const navigate = useNavigate();

  const passwordStrength = getPasswordStrength(password);

  const validate = () => {
    const newErrors: { [key: string]: string } = {};

    if (!name.trim()) {
      newErrors.name = 'Full name is required';
    } else if (name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    }

    if (!email.trim()) {
      newErrors.email = 'Email address is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }

    if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (role === 'admin' && !company.trim()) {
      newErrors.company = 'Company name is required for recruiter accounts';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      const profile = await registerUser(name, email, password, role, company);
      success('Account Created', `Welcome to TalentScout AI, ${profile.name}!`);
      if (profile.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
    } catch (err: any) {
      console.error('Registration error:', err);
      let message = 'Unable to complete registration. Please try again.';
      if (err.code === 'auth/email-already-in-use') {
        message = 'This email address is already in use. Try signing in instead.';
        setErrors((prev) => ({ ...prev, email: message }));
      } else if (err.code === 'auth/weak-password') {
        message = 'Password is too weak. Please use at least 8 characters.';
        setErrors((prev) => ({ ...prev, password: message }));
      } else if (err.code === 'auth/invalid-email') {
        message = 'Invalid email address format.';
        setErrors((prev) => ({ ...prev, email: message }));
      }
      showError('Registration Failed', message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col lg:flex-row">
      {/* Left Form Panel */}
      <div className="flex-1 flex items-center justify-center py-10 px-4 sm:px-8 lg:px-12 bg-white dark:bg-slate-950 transition-colors">
        <div className="w-full max-w-lg space-y-7">
          {/* Header */}
          <div className="space-y-2">
            <Link to="/" className="inline-flex items-center gap-2 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline mb-2">
              ← Back to home
            </Link>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Create your TalentScout account
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Start finding top talent or get discovered with instant AI resume benchmarking.
            </p>
          </div>

          {/* Role Selection Cards */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2.5">
              Select Your Role
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Candidate Card */}
              <button
                type="button"
                onClick={() => setRole('user')}
                className={`p-4 rounded-xl border text-left transition-all relative ${
                  role === 'user'
                    ? 'border-indigo-600 dark:border-indigo-500 bg-indigo-50/60 dark:bg-indigo-950/40 ring-1 ring-indigo-600 dark:ring-indigo-500 shadow-xs'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                    <UserCheck className="w-4 h-4" />
                  </div>
                  {role === 'user' && (
                    <CheckCircle2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  )}
                </div>
                <div className="font-bold text-sm text-slate-900 dark:text-white">I'm a Candidate</div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                  Apply with PDF resume & receive instant AI score diagnostics
                </div>
              </button>

              {/* Recruiter Card */}
              <button
                type="button"
                onClick={() => setRole('admin')}
                className={`p-4 rounded-xl border text-left transition-all relative ${
                  role === 'admin'
                    ? 'border-indigo-600 dark:border-indigo-500 bg-indigo-50/60 dark:bg-indigo-950/40 ring-1 ring-indigo-600 dark:ring-indigo-500 shadow-xs'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                    <Briefcase className="w-4 h-4" />
                  </div>
                  {role === 'admin' && (
                    <CheckCircle2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  )}
                </div>
                <div className="font-bold text-sm text-slate-900 dark:text-white">I'm a Recruiter</div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                  Post jobs, review ranked candidate leaderboards & shortlist
                </div>
              </button>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {/* Full Name */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                Full Name
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (errors.name) setErrors((prev) => ({ ...prev, name: '' }));
                  }}
                  placeholder="e.g. Elena Rostova"
                  className={`w-full pl-10 pr-4 py-2.5 text-sm rounded-xl bg-slate-50 dark:bg-slate-900 border ${
                    errors.name ? 'border-rose-500 focus:ring-rose-500' : 'border-slate-200 dark:border-slate-800 focus:ring-indigo-500'
                  } text-slate-900 dark:text-white focus:outline-none focus:ring-2`}
                />
              </div>
              {errors.name && <p className="text-xs text-rose-500 mt-1">{errors.name}</p>}
            </div>

            {/* Email Address */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                Work / Personal Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (errors.email) setErrors((prev) => ({ ...prev, email: '' }));
                  }}
                  placeholder="name@domain.com"
                  className={`w-full pl-10 pr-4 py-2.5 text-sm rounded-xl bg-slate-50 dark:bg-slate-900 border ${
                    errors.email ? 'border-rose-500 focus:ring-rose-500' : 'border-slate-200 dark:border-slate-800 focus:ring-indigo-500'
                  } text-slate-900 dark:text-white focus:outline-none focus:ring-2`}
                />
              </div>
              {errors.email && <p className="text-xs text-rose-500 mt-1">{errors.email}</p>}
            </div>

            {/* Company Name (For Recruiters / Admins) */}
            {role === 'admin' && (
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                  Company / Organization Name
                </label>
                <div className="relative">
                  <Building className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={company}
                    onChange={(e) => {
                      setCompany(e.target.value);
                      if (errors.company) setErrors((prev) => ({ ...prev, company: '' }));
                    }}
                    placeholder="e.g. Acme Tech Labs"
                    className={`w-full pl-10 pr-4 py-2.5 text-sm rounded-xl bg-slate-50 dark:bg-slate-900 border ${
                      errors.company ? 'border-rose-500 focus:ring-rose-500' : 'border-slate-200 dark:border-slate-800 focus:ring-indigo-500'
                    } text-slate-900 dark:text-white focus:outline-none focus:ring-2`}
                  />
                </div>
                {errors.company && <p className="text-xs text-rose-500 mt-1">{errors.company}</p>}
              </div>
            )}

            {/* Password */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errors.password) setErrors((prev) => ({ ...prev, password: '' }));
                  }}
                  placeholder="At least 8 characters"
                  className={`w-full pl-10 pr-10 py-2.5 text-sm rounded-xl bg-slate-50 dark:bg-slate-900 border ${
                    errors.password ? 'border-rose-500 focus:ring-rose-500' : 'border-slate-200 dark:border-slate-800 focus:ring-indigo-500'
                  } text-slate-900 dark:text-white focus:outline-none focus:ring-2`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Password Strength Meter */}
              {password.length > 0 && (
                <div className="mt-2 space-y-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-500 dark:text-slate-400">Strength: {passwordStrength.label}</span>
                    <span className="text-slate-400 text-[10px]">{passwordStrength.feedback}</span>
                  </div>
                  <div className="grid grid-cols-4 gap-1.5 h-1.5">
                    {[1, 2, 3, 4].map((step) => (
                      <div
                        key={step}
                        className={`rounded-full transition-all duration-300 ${
                          passwordStrength.score >= step
                            ? passwordStrength.colorClass
                            : 'bg-slate-200 dark:bg-slate-800'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              )}
              {errors.password && <p className="text-xs text-rose-500 mt-1">{errors.password}</p>}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    if (errors.confirmPassword) setErrors((prev) => ({ ...prev, confirmPassword: '' }));
                  }}
                  placeholder="Repeat your password"
                  className={`w-full pl-10 pr-10 py-2.5 text-sm rounded-xl bg-slate-50 dark:bg-slate-900 border ${
                    errors.confirmPassword ? 'border-rose-500 focus:ring-rose-500' : 'border-slate-200 dark:border-slate-800 focus:ring-indigo-500'
                  } text-slate-900 dark:text-white focus:outline-none focus:ring-2`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="text-xs text-rose-500 mt-1">{errors.confirmPassword}</p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-3 inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-semibold text-sm shadow-sm shadow-indigo-600/25 active:scale-[0.99] transition-all cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Creating Account...</span>
                </>
              ) : (
                <>
                  <span>Create Account as {role === 'admin' ? 'Recruiter' : 'Candidate'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="pt-2 text-center text-xs text-slate-500 dark:text-slate-400">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-indigo-600 dark:text-indigo-400 hover:underline">
              Sign in
            </Link>
          </div>
        </div>
      </div>

      {/* Right Split-Screen Pitch & Testimonial Panel */}
      <div className="hidden lg:flex flex-1 relative bg-gradient-to-br from-indigo-900 via-indigo-950 to-slate-950 p-12 text-white flex-col justify-between overflow-hidden">
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 rounded-full bg-indigo-500/20 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 rounded-full bg-indigo-600/20 blur-3xl pointer-events-none" />

        {/* Top Branding Pitch */}
        <div className="relative space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold bg-white/10 text-indigo-200 border border-white/10 backdrop-blur-md">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>Google Gemini 2.5 Flash Engine</span>
          </div>

          <h2 className="text-3xl font-extrabold tracking-tight leading-tight">
            Stop sifting through hundreds of PDFs manually.
          </h2>

          <p className="text-indigo-200/90 text-sm leading-relaxed max-w-md">
            TalentScout AI evaluates candidate resumes with deep semantic understanding of technical nuance, project scale, and exact job requirements.
          </p>

          <div className="space-y-3 pt-2">
            <div className="flex items-center gap-2.5 text-xs text-indigo-100">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Direct PDF parsing with zero OCR error rate</span>
            </div>
            <div className="flex items-center gap-2.5 text-xs text-indigo-100">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Objective 0–100 candidate ranking leaderboard</span>
            </div>
            <div className="flex items-center gap-2.5 text-xs text-indigo-100">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Instant skill gap analysis and red flag detection</span>
            </div>
          </div>
        </div>

        {/* Testimonial Card */}
        <div className="relative rounded-2xl bg-white/10 border border-white/15 p-6 backdrop-blur-md space-y-4">
          <Quote className="w-6 h-6 text-indigo-400 opacity-60" />
          <p className="text-sm text-indigo-100 leading-relaxed italic">
            "TalentScout AI transformed our tech hiring. What used to take a team of three recruiters 20 hours each week now takes 15 minutes of reviewing Gemini's ranked candidates."
          </p>
          <div className="flex items-center gap-3 pt-1">
            <div className="w-9 h-9 rounded-full bg-indigo-500/40 border border-indigo-400/30 flex items-center justify-center font-bold text-xs text-white">
              SL
            </div>
            <div>
              <div className="text-xs font-bold text-white">Sarah Lin</div>
              <div className="text-[11px] text-indigo-300">VP of Engineering at HyperScale AI</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
