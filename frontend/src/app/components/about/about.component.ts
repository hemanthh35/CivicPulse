import { Component } from '@angular/core';

@Component({
  selector: 'app-about',
  templateUrl: './about.component.html',
  styleUrls: ['./about.component.scss']
})
export class AboutComponent {
  features = [
    {
      icon: '📱',
      title: 'Easy Reporting',
      description: 'Report civic issues instantly with photos and location data. Your voice matters in building a better community.'
    },
    {
      icon: '👥',
      title: 'Community Driven',
      description: 'Connect with fellow citizens who care about their neighborhood. Together, we create positive change.'
    },
    {
      icon: '⚡',
      title: 'Fast Response',
      description: 'Issues are quickly assigned to municipal workers who can address them efficiently and effectively.'
    },
    {
      icon: '🏆',
      title: 'Rewards System',
      description: 'Earn points and recognition for active participation. Your engagement helps build a better city.'
    },
    {
      icon: '🔍',
      title: 'Transparency',
      description: 'Track the status of reported issues in real-time. See the impact of your contributions.'
    },
    {
      icon: '🛡️',
      title: 'Moderation',
      description: 'Quality-controlled platform ensures legitimate issues get attention while spam is filtered out.'
    }
  ];

  howItWorks = [
    {
      step: '1',
      title: 'Spot an Issue',
      description: 'Notice a pothole, broken streetlight, or other civic problem in your neighborhood.'
    },
    {
      step: '2',
      title: 'Report It',
      description: 'Take a photo, add location details, and submit your complaint through our easy-to-use platform.'
    },
    {
      step: '3',
      title: 'Get Verified',
      description: 'Our moderation team reviews submissions to ensure quality and legitimacy.'
    },
    {
      step: '4',
      title: 'Track Progress',
      description: 'Municipal workers are assigned to fix the issue. Follow updates until completion.'
    },
    {
      step: '5',
      title: 'Earn Rewards',
      description: 'Gain points for verified reports and climb the leaderboard as a civic champion!'
    }
  ];

  stats = [
    { value: '1000+', label: 'Issues Resolved' },
    { value: '500+', label: 'Active Citizens' },
    { value: '50+', label: 'Municipal Workers' },
    { value: '95%', label: 'Satisfaction Rate' }
  ];

  team = [
    {
      role: 'Citizens',
      description: 'Report issues, track progress, and earn rewards for making your community better.'
    },
    {
      role: 'Students',
      description: 'Engage in civic activities, compete on leaderboards, and build a portfolio of community service.'
    },
    {
      role: 'Municipal Workers',
      description: 'Receive assigned tasks, manage workload efficiently, and resolve issues quickly.'
    },
    {
      role: 'Administrators',
      description: 'Oversee platform operations, moderate content, and ensure smooth civic engagement.'
    }
  ];
}
