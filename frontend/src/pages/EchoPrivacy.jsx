import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Shield } from 'lucide-react';

const EchoPrivacy = () => {
    const navigate = useNavigate();

    const handleClose = () => {
        navigate(-1); // Go back to login/register or previous page
    };

    return (
        <div
            onClick={handleClose}
            className="min-h-screen w-screen flex items-center justify-center p-4 md:p-8 overflow-y-auto select-none bg-[#07070c] relative cursor-pointer"
        >
            {/* Ambient background glow */}
            <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-[#7b6ef6]/5 blur-[120px] pointer-events-none" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-[#5956e9]/5 blur-[120px] pointer-events-none" />

            {/* macOS Glassmorphic Card */}
            <div
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-[650px] rounded-3xl overflow-hidden bg-[#0e0e15]/60 border border-white/5 backdrop-blur-xl shadow-[0_32px_80px_rgba(0,0,0,0.6)] z-10 p-8 md:p-10 my-8 animate-fade-in select-text cursor-default"
            >
                <div className="flex flex-col items-center mb-8">
                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4 bg-gradient-to-br from-[#7b6ef6] to-[#5956e9] shadow-[0_8px_24px_rgba(123,110,246,0.25)]">
                        <Shield size={26} className="text-white" />
                    </div>
                    <h1 className="text-2xl font-bold text-white tracking-tight text-center">Privacy Policy</h1>
                    <p className="text-slate-400 text-xs mt-2 text-center">
                        Last Updated: June 12, 2026
                    </p>
                </div>

                <div className="space-y-6 text-slate-300 text-xs leading-relaxed max-h-[400px] overflow-y-auto pr-2 scrollbar-thin">
                    <section>
                        <h2 className="text-sm font-bold text-white mb-2">1. Introduction</h2>
                        <p>
                            Welcome to ECHO ("we," "our," or "us"). We are committed to protecting your personal information and your right to privacy. If you have any questions or concerns about our policy, or our practices with regards to your personal information, please contact us.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-sm font-bold text-white mb-2">2. Information We Collect</h2>
                        <p>
                            We collect personal information that you voluntarily provide to us when registering at ECHO, expressing an interest in obtaining information about us or our products and services, or otherwise contacting us.
                        </p>
                        <ul className="list-disc list-inside mt-2 space-y-1 pl-2 text-slate-400">
                            <li>Account credentials (username, email address, password hash)</li>
                            <li>OAuth profile information (when signing in via Google)</li>
                            <li>Chat history, messages, attachments, and call logs necessary for real-time services</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-sm font-bold text-white mb-2">3. How We Use Your Information</h2>
                        <p>
                            We use personal information collected via our Services for a variety of business purposes described below. We process your personal information for these purposes in reliance on our legitimate business interests, in order to enter into or perform a contract with you, or with your consent.
                        </p>
                        <ul className="list-disc list-inside mt-2 space-y-1 pl-2 text-slate-400">
                            <li>To facilitate account creation and logon process</li>
                            <li>To deliver real-time messages, notifications, and calling services</li>
                            <li>To maintain features like profile customization and cloud storage for attachments</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-sm font-bold text-white mb-2">4. Data Security</h2>
                        <p>
                            We use appropriate technical and organizational security measures designed to protect the security of any personal information we process. However, please also remember that we cannot guarantee that the internet itself is 100% secure. Although we will do our best to protect your personal information, transmission of personal information to and from our Services is at your own risk.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-sm font-bold text-white mb-2">5. Your Privacy Rights</h2>
                        <p>
                            Depending on your location, you may have rights under applicable data protection laws (such as GDPR or CCPA). These may include the right to request access to and obtain a copy of your personal information, request rectification or erasure, or restrict the processing of your personal information.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-sm font-bold text-white mb-2">6. Updates to This Policy</h2>
                        <p>
                            We may update this privacy policy from time to time. The updated version will be indicated by an updated "Last Updated" date and the updated version will be effective as soon as it is accessible. We encourage you to review this privacy policy frequently to be informed of how we are protecting your information.
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

export default EchoPrivacy;
