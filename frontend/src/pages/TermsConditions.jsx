import { Link } from 'react-router-dom';
import { ArrowLeft, Scale } from 'lucide-react';

const TermsConditions = () => {
  return (
    <div className="min-h-screen w-screen flex items-center justify-center p-4 md:p-8 overflow-y-auto select-none bg-[#07070c] relative">
      {/* Ambient background glow */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-[#7b6ef6]/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-[#5956e9]/5 blur-[120px] pointer-events-none" />

      {/* macOS Glassmorphic Card */}
      <div className="w-full max-w-[650px] rounded-3xl overflow-hidden bg-[#0e0e15]/60 border border-white/5 backdrop-blur-xl shadow-[0_32px_80px_rgba(0,0,0,0.6)] z-10 p-8 md:p-10 my-8 animate-fade-in select-text">
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4 bg-gradient-to-br from-[#7b6ef6] to-[#5956e9] shadow-[0_8px_24px_rgba(123,110,246,0.25)]">
            <Scale size={26} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight text-center">Terms of Service</h1>
          <p className="text-slate-400 text-xs mt-2 text-center">
            Last Updated: June 12, 2026
          </p>
        </div>

        <div className="space-y-6 text-slate-300 text-xs leading-relaxed max-h-[400px] overflow-y-auto pr-2 scrollbar-thin">
          <section>
            <h2 className="text-sm font-bold text-white mb-2">1. Agreement to Terms</h2>
            <p>
              By accessing or using ECHO, you agree to be bound by these Terms of Service. If you disagree with any part of the terms, you do not have permission to access the service.
            </p>
          </section>

          <section>
            <h2 className="text-sm font-bold text-white mb-2">2. Accounts and Security</h2>
            <p>
              When you create an account with us, you guarantee that the information you provide is accurate, complete, and current at all times. Inaccurate or obsolete information may result in the immediate termination of your account.
            </p>
            <p className="mt-2">
              You are responsible for maintaining the confidentiality of your account and password, including restricting access to your computer and/or account. You agree to accept responsibility for any and all activities or actions that occur under your account.
            </p>
          </section>

          <section>
            <h2 className="text-sm font-bold text-white mb-2">3. User Conduct & Acceptable Use</h2>
            <p>
              You agree not to use the service for any purpose that is prohibited by these Terms. You are responsible for all of your activity in connection with the service.
            </p>
            <ul className="list-disc list-inside mt-2 space-y-1 pl-2 text-slate-400">
              <li>You shall not transmit spam, unsolicited commercial messages, or chain letters.</li>
              <li>You shall not upload viruses, malware, or other malicious code.</li>
              <li>You shall not harass, abuse, insult, harm, defame, slander, or intimidate other users.</li>
              <li>You shall not attempt to reverse engineer or breach the security of the ECHO platform.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-sm font-bold text-white mb-2">4. Intellectual Property</h2>
            <p>
              The Service and its original content (excluding content provided by users), features, and functionality are and will remain the exclusive property of ECHO and its licensors. Our trademarks and trade dress may not be used in connection with any product or service without our prior written consent.
            </p>
          </section>

          <section>
            <h2 className="text-sm font-bold text-white mb-2">5. Termination</h2>
            <p>
              We may terminate or suspend your account and bar access to the service immediately, without prior notice or liability, under our sole discretion, for any reason whatsoever and without limitation, including but not limited to a breach of the Terms.
            </p>
          </section>

          <section>
            <h2 className="text-sm font-bold text-white mb-2">6. Limitation of Liability</h2>
            <p>
              In no event shall ECHO, nor its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, special, consequential or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from your access to or use of or inability to access or use the service.
            </p>
          </section>
        </div>

        <div className="mt-8 pt-6 border-t border-white/5 text-center">
          <Link to="/login" className="inline-flex items-center gap-2 text-xs text-slate-400 hover:text-white transition-colors">
            <ArrowLeft size={14} />
            Back to Sign In
          </Link>
        </div>
      </div>
    </div>
  );
};

export default TermsConditions;
