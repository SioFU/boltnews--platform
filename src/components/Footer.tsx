import React from 'react';
import { Link } from 'react-router-dom';
import { Github, Twitter, Mail, X } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-gray-900 border-t border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">About BoltNews</h3>
            <p className="text-gray-400">
              BoltNews is your gateway to discovering innovative AI-powered projects. 
              Share your creations, connect with fellow developers, and stay updated 
              with the latest in AI technology.
            </p>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/" className="text-gray-400 hover:text-white transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <a 
                  href="https://bolt.new/"
                  target="_blank"
                  rel="noopener noreferrer" 
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  bolt.new
                </a>
              </li>
              <li>
                <a 
                  href="https://codeium.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  Windsurf
                </a>
              </li>
              <li>
                <a 
                  href="https://chat.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  ChatGPT
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Connect</h3>
            <div className="space-y-4">
              <div className="flex space-x-4">
                <a
                  href="https://github.com/SioFU"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-white transition-colors"
                  title="GitHub"
                >
                  <Github className="h-6 w-6" />
                </a>
                <a
                  href="https://x.com/SioFU_AI"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-white transition-colors"
                  title="Twitter"
                >
                  <Twitter className="h-6 w-6" />
                </a>
                <a
                  href="mailto:fuzihaox@gmail.com"
                  className="text-gray-400 hover:text-white transition-colors"
                  title="Email"
                >
                  <Mail className="h-6 w-6" />
                </a>
              </div>
              <p className="text-gray-400 text-sm">
                Have questions? Email us at{' '}
                <a 
                  href="mailto:fuzihaox@gmail.com" 
                  className="text-blue-400 hover:text-blue-300 transition-colors"
                >
                  fuzihaox@gmail.com
                </a>
              </p>
            </div>
          </div>
        </div>
        <div className="mt-8 pt-8 border-t border-gray-800">
          <p className="text-center text-gray-400">
            &copy; {new Date().getFullYear()} BoltNews. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}