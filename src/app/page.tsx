import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

export default function HomePage() {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          CV + Cover Letter Generator
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          Generate tailored professional documents in German and English with AI-powered job analysis
        </p>
        <div className="flex justify-center space-x-4">
          <Link href="/profile">
            <Button size="lg" className="px-8">
              Get Started
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-8 mb-12">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <span className="bg-blue-100 text-blue-600 rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold mr-3">
                1
              </span>
              Enter Your Profile
            </CardTitle>
            <CardDescription>
              Add your professional information once and reuse it for multiple applications
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="text-sm text-gray-600 space-y-2">
              <li>• Header information (name, contact, links)</li>
              <li>• Professional summary</li>
              <li>• Work experience with achievements</li>
              <li>• Education, skills, and languages</li>
              <li>• Auto-saves to your browser</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <span className="bg-blue-100 text-blue-600 rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold mr-3">
                2
              </span>
              Analyze Job Requirements
            </CardTitle>
            <CardDescription>
              Paste job descriptions and get AI-powered keyword analysis
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="text-sm text-gray-600 space-y-2">
              <li>• Extract must-have keywords</li>
              <li>• Identify preferred skills</li>
              <li>• Detect language requirements</li>
              <li>• Color-coded keyword display</li>
              <li>• Powered by Perplexity AI</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <span className="bg-blue-100 text-blue-600 rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold mr-3">
                3
              </span>
              Select Documents
            </CardTitle>
            <CardDescription>
              Choose which documents to generate - you're in control
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="text-sm text-gray-600 space-y-2">
              <li>• German CV (2 pages max)</li>
              <li>• English CV (2 pages max)</li>
              <li>• German Cover Letter (1 page)</li>
              <li>• English Cover Letter (1 page)</li>
              <li>• Generate only what you need</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <span className="bg-blue-100 text-blue-600 rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold mr-3">
                4
              </span>
              Preview & Download
            </CardTitle>
            <CardDescription>
              Review documents before downloading with proper formatting
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="text-sm text-gray-600 space-y-2">
              <li>• Full-screen PDF preview</li>
              <li>• Keyword match scoring</li>
              <li>• Strict page limit enforcement</li>
              <li>• Professional German formats</li>
              <li>• Download individual or ZIP</li>
            </ul>
          </CardContent>
        </Card>
      </div>

      <div className="bg-blue-50 rounded-lg p-8 text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Key Features
        </h2>
        <div className="grid md:grid-cols-3 gap-6 text-sm">
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">Privacy First</h3>
            <p className="text-gray-600">All data stays in your browser. No accounts, no servers.</p>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">Format Compliant</h3>
            <p className="text-gray-600">German documents match professional standards exactly.</p>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">AI Tailored</h3>
            <p className="text-gray-600">Content optimized for each job with keyword matching.</p>
          </div>
        </div>
      </div>
    </div>
  );
}