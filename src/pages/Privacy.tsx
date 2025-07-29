import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const Privacy = () => {
  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/">
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Link>
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Privacy Policy</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-slate dark:prose-invert max-w-none space-y-6">
            <div>
              <h2 className="text-lg font-semibold mb-3">Information We Collect</h2>
              <p className="text-muted-foreground">
                Our application collects and processes health and fitness data from connected devices and services, including:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1 mt-2">
                <li>Recovery scores, heart rate variability, and resting heart rate from Whoop</li>
                <li>Sleep duration, efficiency, and sleep stages</li>
                <li>Workout strain scores and activity data</li>
                <li>Body composition data from DEXA scans</li>
                <li>Strength training data from StrongLifts and similar apps</li>
              </ul>
            </div>

            <div>
              <h2 className="text-lg font-semibold mb-3">How We Use Your Information</h2>
              <p className="text-muted-foreground">
                We use your health data to:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1 mt-2">
                <li>Provide personalized health insights and recommendations</li>
                <li>Track your progress toward fitness and body composition goals</li>
                <li>Generate AI-powered coaching suggestions</li>
                <li>Display analytics and trends in your health metrics</li>
              </ul>
            </div>

            <div>
              <h2 className="text-lg font-semibold mb-3">Data Storage and Security</h2>
              <p className="text-muted-foreground">
                Your data is stored securely using Supabase, a trusted cloud database provider. We implement industry-standard security measures to protect your personal health information.
              </p>
            </div>

            <div>
              <h2 className="text-lg font-semibold mb-3">Third-Party Services</h2>
              <p className="text-muted-foreground">
                We integrate with the following third-party services to collect your health data:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1 mt-2">
                <li>Whoop (recovery, sleep, and activity data)</li>
                <li>StrongLifts (strength training data)</li>
                <li>Other fitness tracking applications as connected by you</li>
              </ul>
            </div>

            <div>
              <h2 className="text-lg font-semibold mb-3">Data Sharing</h2>
              <p className="text-muted-foreground">
                We do not sell, trade, or share your personal health data with third parties except as necessary to provide our services or as required by law.
              </p>
            </div>

            <div>
              <h2 className="text-lg font-semibold mb-3">Your Rights</h2>
              <p className="text-muted-foreground">
                You have the right to:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1 mt-2">
                <li>Access your personal data</li>
                <li>Correct inaccurate data</li>
                <li>Delete your account and associated data</li>
                <li>Disconnect third-party integrations at any time</li>
              </ul>
            </div>

            <div>
              <h2 className="text-lg font-semibold mb-3">Contact Us</h2>
              <p className="text-muted-foreground">
                If you have questions about this Privacy Policy or your data, please contact us through the application or at your registered email address.
              </p>
            </div>

            <div className="text-sm text-muted-foreground pt-4 border-t">
              <p>Last updated: {new Date().toLocaleDateString()}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Privacy;