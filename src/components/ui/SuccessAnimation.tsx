import React from 'react'
import Lottie from 'lottie-react'
import fireworksAnimation from '@/assets/animations/fireworks.json'

interface SuccessAnimationProps {
  onComplete: () => void
}

export function SuccessAnimation({ onComplete }: SuccessAnimationProps) {
  return (
    <div className="fixed inset-0 flex items-center justify-center pointer-events-none z-50">
      <Lottie
        animationData={fireworksAnimation}
        loop={false}
        onComplete={onComplete}
        style={{ width: '100%', height: '100%' }}
      />
    </div>
  )
}

