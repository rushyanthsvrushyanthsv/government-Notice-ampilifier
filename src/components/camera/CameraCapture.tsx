import React, { useRef, useState, useCallback } from 'react';
import Webcam from 'react-webcam';
import { Camera, X, RefreshCw, Check, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../../lib/utils';

interface CameraCaptureProps {
  onCapture: (base64: string) => void;
  onClose: () => void;
}

export const CameraCapture: React.FC<CameraCaptureProps> = ({ onCapture, onClose }) => {
  const webcamRef = useRef<Webcam>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isFlashActive, setIsFlashActive] = useState(false);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');

  const capture = useCallback(() => {
    setIsFlashActive(true);
    setTimeout(() => setIsFlashActive(false), 200);

    const imageSrc = webcamRef.current?.getScreenshot();
    if (imageSrc) {
      setCapturedImage(imageSrc);
    }
  }, [webcamRef]);

  const retake = () => {
    setCapturedImage(null);
  };

  const confirm = () => {
    if (capturedImage) {
      onCapture(capturedImage);
    }
  };

  const switchCamera = () => {
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[150] bg-navy/95 backdrop-blur-xl flex flex-col items-center justify-center p-4 md:p-10"
    >
      <div className="relative w-full max-w-4xl aspect-[3/4] md:aspect-video bg-black rounded-[3rem] overflow-hidden shadow-huge border-4 border-white/10">
        <AnimatePresence>
          {isFlashActive && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-white z-50 pointer-events-none"
            />
          )}
        </AnimatePresence>

        {!capturedImage ? (
          <Webcam
            audio={false}
            ref={webcamRef}
            screenshotFormat="image/jpeg"
            videoConstraints={{
              facingMode: facingMode,
              width: 1280,
              height: 720,
            }}
            className="w-full h-full object-cover"
          />
        ) : (
          <img src={capturedImage} alt="Captured" className="w-full h-full object-cover" />
        )}

        {/* Framing Overlay */}
        {!capturedImage && (
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            <div className="w-[80%] h-[80%] border-2 border-dashed border-white/30 rounded-3xl relative">
              <div className="absolute top-0 left-0 w-10 h-10 border-t-4 border-l-4 border-gold rounded-tl-2xl" />
              <div className="absolute top-0 right-0 w-10 h-10 border-t-4 border-r-4 border-gold rounded-tr-2xl" />
              <div className="absolute bottom-0 left-0 w-10 h-10 border-b-4 border-l-4 border-gold rounded-bl-2xl" />
              <div className="absolute bottom-0 right-0 w-10 h-10 border-b-4 border-r-4 border-gold rounded-br-2xl" />
            </div>
            <p className="absolute bottom-10 text-white/50 font-black uppercase tracking-[0.3em] text-[10px]">Align notice within secure frame</p>
          </div>
        )}

        <button 
          onClick={onClose}
          className="absolute top-6 right-6 w-12 h-12 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white transition-all transition-colors"
        >
          <X size={24} />
        </button>

        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-6">
          {!capturedImage ? (
            <>
              <button 
                onClick={switchCamera}
                className="w-14 h-14 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white transition-all transition-colors"
                title="Switch Camera"
              >
                <RefreshCw size={24} />
              </button>
              
              <button 
                onClick={capture}
                className="w-24 h-24 bg-white rounded-full flex items-center justify-center text-navy shadow-2xl hover:scale-105 active:scale-95 transition-all group"
              >
                <div className="w-20 h-20 border-2 border-navy/10 rounded-full flex items-center justify-center group-hover:scale-90 transition-transform">
                  <Camera size={32} />
                </div>
              </button>

              <div className="w-14 h-14" /> {/* Spacer */}
            </>
          ) : (
            <>
              <button 
                onClick={retake}
                className="h-16 px-10 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center gap-3 text-white font-black uppercase tracking-widest text-xs transition-all"
              >
                <RefreshCw size={18} />
                Retake
              </button>
              
              <button 
                onClick={confirm}
                className="h-16 px-10 bg-gold text-navy rounded-2xl flex items-center justify-center gap-3 font-black uppercase tracking-widest text-xs transition-all hover:scale-105 active:scale-95 shadow-xl shadow-gold/20"
              >
                <Check size={18} />
                Analyze Shot
              </button>
            </>
          )}
        </div>
      </div>

      <div className="mt-10 flex items-center gap-4 px-6 py-3 bg-white/5 rounded-full border border-white/10">
        <Zap size={14} className="text-gold fill-gold" />
        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">Hardware-accelerated OCR enabled</span>
      </div>
    </motion.div>
  );
};
