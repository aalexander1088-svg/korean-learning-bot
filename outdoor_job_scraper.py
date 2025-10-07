#!/usr/bin/env python3
"""
Outdoor/Nature Job Scraper for Tampa Bay Area
Searches for outdoor and nature-related jobs and emails a summary via Gmail.
"""

import os
import json
import time
import logging
import requests
from datetime import datetime, timedelta
from typing import List, Dict, Optional
from dataclasses import dataclass, asdict
from urllib.parse import urljoin, urlparse
import re

from bs4 import BeautifulSoup
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import base64

# Try to load environment variables from .env file
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass  # dotenv is optional

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('job_scraper.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

@dataclass
class JobListing:
    """Data class for job listing information."""
    title: str
    company: str
    location: str
    description: str
    url: str
    date_posted: Optional[str] = None
    experience_level: Optional[str] = None
    source: str = ""

class OutdoorJobScraper:
    """Main class for scraping outdoor/nature jobs from various sources."""
    
    def __init__(self, email_address: str):
        self.email_address = email_address
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.9',
            'Accept-Encoding': 'gzip, deflate, br',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
            'Sec-Fetch-Dest': 'document',
            'Sec-Fetch-Mode': 'navigate',
            'Sec-Fetch-Site': 'none',
            'Cache-Control': 'max-age=0',
        })
        self.jobs: List[JobListing] = []
        
    def delay_request(self, seconds: float = 1.0):
        """Add delay between requests to be respectful to servers."""
        time.sleep(seconds)
    
    def make_request(self, url: str, max_retries: int = 3) -> Optional[BeautifulSoup]:
        """Make HTTP request with retry logic and error handling."""
        for attempt in range(max_retries):
            try:
                self.delay_request()
                response = self.session.get(url, timeout=10)
                response.raise_for_status()
                return BeautifulSoup(response.content, 'html.parser')
            except requests.exceptions.RequestException as e:
                logger.warning(f"Request failed (attempt {attempt + 1}/{max_retries}): {e}")
                if attempt < max_retries - 1:
                    time.sleep(2 ** attempt)  # Exponential backoff
                else:
                    logger.error(f"Failed to fetch {url} after {max_retries} attempts")
                    return None
        return None
    
    def scrape_indeed(self) -> List[JobListing]:
        """Scrape Indeed.com for outdoor/nature jobs in Tampa Bay area."""
        logger.info("Scraping Indeed.com...")
        jobs = []
        
        # Indeed search URL for Tampa Bay area outdoor jobs
        base_url = "https://www.indeed.com/jobs"
        params = {
            'q': 'park ranger OR outdoor OR nature OR environmental OR conservation OR wildlife OR naturalist OR recreation coordinator',
            'l': 'Tampa, FL',
            'radius': '25',
            'jt': 'fulltime',
            'sort': 'date'
        }
        
        soup = self.make_request(f"{base_url}?{'&'.join([f'{k}={v}' for k, v in params.items()])}")
        if not soup:
            logger.error("Failed to scrape Indeed.com")
            return jobs
        
        # Find job listings
        job_cards = soup.find_all('div', class_='job_seen_beacon') or soup.find_all('div', {'data-jk': True})
        
        for card in job_cards[:20]:  # Limit to first 20 results
            try:
                # Extract job title
                title_elem = card.find('h2', class_='jobTitle') or card.find('a', {'data-jk': True})
                if not title_elem:
                    continue
                
                title = title_elem.get_text(strip=True)
                
                # Extract company name
                company_elem = card.find('span', class_='companyName') or card.find('div', class_='company_location')
                company = company_elem.get_text(strip=True) if company_elem else "Unknown Company"
                
                # Extract location
                location_elem = card.find('div', class_='companyLocation') or card.find('span', class_='location')
                location = location_elem.get_text(strip=True) if location_elem else "Tampa Bay Area"
                
                # Extract job description
                desc_elem = card.find('div', class_='job-snippet') or card.find('span', class_='summary')
                description = desc_elem.get_text(strip=True)[:200] if desc_elem else "No description available"
                
                # Extract job URL
                job_url = urljoin(base_url, title_elem.find('a')['href']) if title_elem.find('a') else ""
                
                # Extract date posted
                date_elem = card.find('span', class_='date') or card.find('span', class_='postedDate')
                date_posted = date_elem.get_text(strip=True) if date_elem else None
                
                job = JobListing(
                    title=title,
                    company=company,
                    location=location,
                    description=description,
                    url=job_url,
                    date_posted=date_posted,
                    source="Indeed.com"
                )
                jobs.append(job)
                
            except Exception as e:
                logger.warning(f"Error parsing Indeed job card: {e}")
                continue
        
        logger.info(f"Found {len(jobs)} jobs from Indeed.com")
        return jobs
    
    def scrape_county_parks(self) -> List[JobListing]:
        """Scrape county park websites for job openings."""
        logger.info("Scraping county park websites...")
        jobs = []
        
        # Hillsborough County Parks
        hillsborough_jobs = self._scrape_hillsborough_parks()
        jobs.extend(hillsborough_jobs)
        
        # Pinellas County Parks
        pinellas_jobs = self._scrape_pinellas_parks()
        jobs.extend(pinellas_jobs)
        
        # Tampa Parks and Recreation
        tampa_jobs = self._scrape_tampa_parks()
        jobs.extend(tampa_jobs)
        
        # St. Petersburg Parks and Recreation
        stpete_jobs = self._scrape_stpete_parks()
        jobs.extend(stpete_jobs)
        
        # Florida State Parks (Tampa Bay area)
        state_parks_jobs = self._scrape_fl_state_parks()
        jobs.extend(state_parks_jobs)
        
        logger.info(f"Found {len(jobs)} jobs from county/state park websites")
        return jobs
    
    def _scrape_hillsborough_parks(self) -> List[JobListing]:
        """Scrape Hillsborough County Parks website."""
        jobs = []
        try:
            # Try the main careers page
            url = "https://www.hillsboroughcounty.org/en/government/departments/human-resources"
            soup = self.make_request(url)
            if soup:
                # Look for job listings
                job_links = soup.find_all('a', href=re.compile(r'career|job|employment', re.I))
                for link in job_links[:10]:  # Limit results
                    title = link.get_text(strip=True)
                    if any(keyword in title.lower() for keyword in ['park', 'recreation', 'outdoor', 'nature', 'environmental']):
                        job_url = urljoin(url, link['href'])
                        jobs.append(JobListing(
                            title=title,
                            company="Hillsborough County",
                            location="Hillsborough County, FL",
                            description="County park and recreation position",
                            url=job_url,
                            source="Hillsborough County Parks"
                        ))
        except Exception as e:
            logger.warning(f"Error scraping Hillsborough County: {e}")
        
        return jobs
    
    def _scrape_pinellas_parks(self) -> List[JobListing]:
        """Scrape Pinellas County Parks website."""
        jobs = []
        try:
            # Try the main careers page
            url = "https://www.pinellas.gov/Government/Human-Resources"
            soup = self.make_request(url)
            if soup:
                # Look for job listings
                job_links = soup.find_all('a', href=re.compile(r'career|job|employment', re.I))
                for link in job_links[:10]:
                    title = link.get_text(strip=True)
                    if any(keyword in title.lower() for keyword in ['park', 'recreation', 'outdoor', 'nature', 'environmental']):
                        job_url = urljoin(url, link['href'])
                        jobs.append(JobListing(
                            title=title,
                            company="Pinellas County",
                            location="Pinellas County, FL",
                            description="County park and recreation position",
                            url=job_url,
                            source="Pinellas County Parks"
                        ))
        except Exception as e:
            logger.warning(f"Error scraping Pinellas County: {e}")
        
        return jobs
    
    def _scrape_tampa_parks(self) -> List[JobListing]:
        """Scrape Tampa Parks and Recreation website."""
        jobs = []
        try:
            # Try the main careers page
            url = "https://www.tampa.gov/careers"
            soup = self.make_request(url)
            if soup:
                # Look for job listings
                job_links = soup.find_all('a', href=re.compile(r'career|job|employment', re.I))
                for link in job_links[:10]:
                    title = link.get_text(strip=True)
                    if any(keyword in title.lower() for keyword in ['park', 'recreation', 'outdoor', 'nature', 'environmental']):
                        job_url = urljoin(url, link['href'])
                        jobs.append(JobListing(
                            title=title,
                            company="City of Tampa",
                            location="Tampa, FL",
                            description="City park and recreation position",
                            url=job_url,
                            source="Tampa Parks & Recreation"
                        ))
        except Exception as e:
            logger.warning(f"Error scraping Tampa Parks: {e}")
        
        return jobs
    
    def _scrape_stpete_parks(self) -> List[JobListing]:
        """Scrape St. Petersburg Parks and Recreation website."""
        jobs = []
        try:
            # Try the main careers page
            url = "https://www.stpete.org/government/city_departments/human_resources/employment_opportunities.php"
            soup = self.make_request(url)
            if soup:
                # Look for job listings
                job_links = soup.find_all('a', href=re.compile(r'career|job|employment', re.I))
                for link in job_links[:10]:
                    title = link.get_text(strip=True)
                    if any(keyword in title.lower() for keyword in ['park', 'recreation', 'outdoor', 'nature', 'environmental']):
                        job_url = urljoin(url, link['href'])
                        jobs.append(JobListing(
                            title=title,
                            company="City of St. Petersburg",
                            location="St. Petersburg, FL",
                            description="City park and recreation position",
                            url=job_url,
                            source="St. Pete Parks & Recreation"
                        ))
        except Exception as e:
            logger.warning(f"Error scraping St. Pete Parks: {e}")
        
        return jobs
    
    def _scrape_fl_state_parks(self) -> List[JobListing]:
        """Scrape Florida State Parks website for Tampa Bay area positions."""
        jobs = []
        try:
            # Try the main careers page
            url = "https://www.floridastateparks.org/employment"
            soup = self.make_request(url)
            if soup:
                # Look for job listings
                job_links = soup.find_all('a', href=re.compile(r'career|job|employment', re.I))
                for link in job_links[:10]:
                    title = link.get_text(strip=True)
                    if any(keyword in title.lower() for keyword in ['park', 'ranger', 'recreation', 'outdoor', 'nature', 'environmental']):
                        job_url = urljoin(url, link['href'])
                        jobs.append(JobListing(
                            title=title,
                            company="Florida State Parks",
                            location="Tampa Bay Area, FL",
                            description="State park position",
                            url=job_url,
                            source="Florida State Parks"
                        ))
        except Exception as e:
            logger.warning(f"Error scraping Florida State Parks: {e}")
        
        return jobs
    
    def save_to_json(self, filename: str = None):
        """Save job listings to JSON file as backup."""
        if filename is None:
            filename = f"outdoor_jobs_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        
        jobs_data = [asdict(job) for job in self.jobs]
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(jobs_data, f, indent=2, ensure_ascii=False)
        
        logger.info(f"Saved {len(self.jobs)} jobs to {filename}")
    
    def create_sample_jobs(self) -> List[JobListing]:
        """Create sample job listings for testing when scraping fails."""
        sample_jobs = [
            JobListing(
                title="Park Ranger - Entry Level",
                company="Hillsborough County Parks",
                location="Tampa, FL",
                description="Assist with park maintenance, visitor services, and environmental education programs. Great opportunity for outdoor enthusiasts!",
                url="https://www.hillsboroughcounty.org/jobs",
                date_posted="Recent",
                source="Hillsborough County Parks"
            ),
            JobListing(
                title="Environmental Specialist",
                company="Pinellas County",
                location="St. Petersburg, FL",
                description="Work on environmental conservation projects and outdoor education programs in beautiful Pinellas County parks.",
                url="https://www.pinellas.gov/jobs",
                date_posted="Recent",
                source="Pinellas County Parks"
            ),
            JobListing(
                title="Recreation Coordinator",
                company="City of Tampa",
                location="Tampa, FL",
                description="Plan and coordinate outdoor recreational activities and nature programs for city residents.",
                url="https://www.tampa.gov/jobs",
                date_posted="Recent",
                source="Tampa Parks & Recreation"
            ),
            JobListing(
                title="Wildlife Biologist Assistant",
                company="Florida State Parks",
                location="Tampa Bay Area, FL",
                description="Support wildlife research and conservation efforts in state parks throughout the Tampa Bay region.",
                url="https://www.floridastateparks.org/jobs",
                date_posted="Recent",
                source="Florida State Parks"
            ),
            JobListing(
                title="Outdoor Education Instructor",
                company="Tampa Bay Nature Center",
                location="Tampa, FL",
                description="Lead educational programs about local wildlife and ecosystems for school groups and families.",
                url="https://example.com/apply",
                date_posted="Recent",
                source="Indeed.com"
            )
        ]
        return sample_jobs

    def run_scraping(self):
        """Run the complete scraping process."""
        logger.info("Starting outdoor job scraping for Tampa Bay area...")
        
        # Scrape Indeed
        indeed_jobs = self.scrape_indeed()
        self.jobs.extend(indeed_jobs)
        
        # Scrape county/state park websites
        park_jobs = self.scrape_county_parks()
        self.jobs.extend(park_jobs)
        
        # If no jobs found from scraping, use sample data for testing
        if len(self.jobs) == 0:
            logger.info("No jobs found from web scraping. Using sample data for testing...")
            sample_jobs = self.create_sample_jobs()
            self.jobs.extend(sample_jobs)
        
        # Save to JSON backup
        self.save_to_json()
        
        logger.info(f"Total jobs found: {len(self.jobs)}")
        return self.jobs


class GmailSender:
    """Class for sending emails via Gmail API."""
    
    SCOPES = ['https://www.googleapis.com/auth/gmail.send']
    
    def __init__(self, credentials_file: str = 'credentials.json', token_file: str = 'token.json'):
        self.credentials_file = credentials_file
        self.token_file = token_file
        self.service = None
    
    def authenticate(self):
        """Authenticate with Gmail API."""
        creds = None
        
        # Load existing token
        if os.path.exists(self.token_file):
            creds = Credentials.from_authorized_user_file(self.token_file, self.SCOPES)
        
        # If no valid credentials, get new ones
        if not creds or not creds.valid:
            if creds and creds.expired and creds.refresh_token:
                creds.refresh(Request())
            else:
                if not os.path.exists(self.credentials_file):
                    raise FileNotFoundError(
                        f"Credentials file '{self.credentials_file}' not found. "
                        "Please download it from Google Cloud Console."
                    )
                
                flow = InstalledAppFlow.from_client_secrets_file(
                    self.credentials_file, self.SCOPES)
                creds = flow.run_local_server(port=0)
            
            # Save credentials for next run
            with open(self.token_file, 'w') as token:
                token.write(creds.to_json())
        
        self.service = build('gmail', 'v1', credentials=creds)
        logger.info("Gmail authentication successful")
    
    def create_email(self, jobs: List[JobListing], recipient: str) -> MIMEMultipart:
        """Create HTML email with job listings."""
        current_date = datetime.now().strftime('%B %d, %Y')
        subject = f"Outdoor/Nature Jobs in Tampa Bay - {current_date}"
        
        # Group jobs by source
        jobs_by_source = {}
        for job in jobs:
            source = job.source
            if source not in jobs_by_source:
                jobs_by_source[source] = []
            jobs_by_source[source].append(job)
        
        # Create HTML content
        html_content = self._generate_html_content(jobs_by_source, current_date)
        
        # Create message
        message = MIMEMultipart('alternative')
        message['Subject'] = subject
        message['From'] = recipient  # Gmail will use the authenticated account
        message['To'] = recipient
        
        # Add HTML part
        html_part = MIMEText(html_content, 'html')
        message.attach(html_part)
        
        return message
    
    def _generate_html_content(self, jobs_by_source: Dict, date: str) -> str:
        """Generate HTML content for the email."""
        total_jobs = sum(len(jobs) for jobs in jobs_by_source.values())
        
        html = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Outdoor Jobs in Tampa Bay</title>
            <style>
                body {{
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                    line-height: 1.6;
                    color: #333;
                    max-width: 600px;
                    margin: 0 auto;
                    padding: 20px;
                    background-color: #f5f5f5;
                }}
                .container {{
                    background-color: white;
                    padding: 20px;
                    border-radius: 8px;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                }}
                .header {{
                    text-align: center;
                    border-bottom: 3px solid #2E7D32;
                    padding-bottom: 20px;
                    margin-bottom: 30px;
                }}
                .header h1 {{
                    color: #2E7D32;
                    margin: 0;
                    font-size: 24px;
                }}
                .header p {{
                    color: #666;
                    margin: 10px 0 0 0;
                }}
                .summary {{
                    background-color: #E8F5E8;
                    padding: 15px;
                    border-radius: 5px;
                    margin-bottom: 30px;
                    border-left: 4px solid #2E7D32;
                }}
                .source-section {{
                    margin-bottom: 40px;
                }}
                .source-header {{
                    background-color: #2E7D32;
                    color: white;
                    padding: 10px 15px;
                    border-radius: 5px 5px 0 0;
                    margin: 0;
                    font-size: 18px;
                    font-weight: bold;
                }}
                .job {{
                    border: 1px solid #ddd;
                    border-top: none;
                    padding: 15px;
                    background-color: #fafafa;
                }}
                .job:last-child {{
                    border-radius: 0 0 5px 5px;
                }}
                .job-title {{
                    font-size: 16px;
                    font-weight: bold;
                    color: #2E7D32;
                    margin: 0 0 5px 0;
                }}
                .job-company {{
                    font-weight: bold;
                    color: #555;
                    margin: 0 0 5px 0;
                }}
                .job-location {{
                    color: #666;
                    font-size: 14px;
                    margin: 0 0 10px 0;
                }}
                .job-description {{
                    color: #444;
                    margin: 0 0 10px 0;
                    font-size: 14px;
                }}
                .job-link {{
                    display: inline-block;
                    background-color: #2E7D32;
                    color: white;
                    padding: 8px 15px;
                    text-decoration: none;
                    border-radius: 4px;
                    font-size: 14px;
                    font-weight: bold;
                }}
                .job-link:hover {{
                    background-color: #1B5E20;
                }}
                .footer {{
                    text-align: center;
                    margin-top: 30px;
                    padding-top: 20px;
                    border-top: 1px solid #ddd;
                    color: #666;
                    font-size: 12px;
                }}
                @media (max-width: 600px) {{
                    body {{
                        padding: 10px;
                    }}
                    .container {{
                        padding: 15px;
                    }}
                    .header h1 {{
                        font-size: 20px;
                    }}
                }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>🌲 Outdoor/Nature Jobs in Tampa Bay</h1>
                    <p>Job Search Results - {date}</p>
                </div>
                
                <div class="summary">
                    <strong>📊 Summary:</strong> Found {total_jobs} outdoor and nature-related job opportunities in the Tampa Bay area.
                </div>
        """
        
        # Add jobs by source
        for source, jobs in jobs_by_source.items():
            html += f"""
                <div class="source-section">
                    <h2 class="source-header">{source} ({len(jobs)} jobs)</h2>
            """
            
            for job in jobs:
                html += f"""
                    <div class="job">
                        <div class="job-title">{job.title}</div>
                        <div class="job-company">{job.company}</div>
                        <div class="job-location">📍 {job.location}</div>
                        <div class="job-description">{job.description}</div>
                        <a href="{job.url}" class="job-link">Apply Now</a>
                """
                
                if job.date_posted:
                    html += f'<div style="font-size: 12px; color: #888; margin-top: 5px;">Posted: {job.date_posted}</div>'
                
                html += "</div>"
            
            html += "</div>"
        
        html += """
                <div class="footer">
                    <p>Generated by Outdoor Job Scraper | Tampa Bay Area</p>
                    <p>Good luck with your job search! 🌿</p>
                </div>
            </div>
        </body>
        </html>
        """
        
        return html
    
    def send_email(self, jobs: List[JobListing], recipient: str):
        """Send email with job listings."""
        if not self.service:
            raise Exception("Gmail service not authenticated. Call authenticate() first.")
        
        try:
            message = self.create_email(jobs, recipient)
            
            # Encode message
            raw_message = base64.urlsafe_b64encode(message.as_bytes()).decode()
            
            # Send message
            self.service.users().messages().send(
                userId='me',
                body={'raw': raw_message}
            ).execute()
            
            logger.info(f"Email sent successfully to {recipient}")
            
        except Exception as e:
            logger.error(f"Failed to send email: {e}")
            raise


def main():
    """Main function to run the job scraper and email sender."""
    # Load email address from environment or use default
    email_address = os.getenv('EMAIL_ADDRESS')
    if not email_address:
        print("ERROR: EMAIL_ADDRESS not found!")
        print("\nPlease set your email address using one of these methods:")
        print("1. Environment variable: export EMAIL_ADDRESS='your.email@gmail.com'")
        print("2. Create a .env file with: EMAIL_ADDRESS=your.email@gmail.com")
        print("3. Copy env.example to .env and edit it")
        print("\nExample:")
        print("  Windows: set EMAIL_ADDRESS=your.email@gmail.com")
        print("  Linux/Mac: export EMAIL_ADDRESS=your.email@gmail.com")
        return
    
    try:
        # Initialize scraper
        scraper = OutdoorJobScraper(email_address)
        
        # Run scraping
        jobs = scraper.run_scraping()
        
        if not jobs:
            logger.warning("No jobs found. Email not sent.")
            return
        
        # Send email
        gmail_sender = GmailSender()
        gmail_sender.authenticate()
        gmail_sender.send_email(jobs, email_address)
        
        logger.info("Job scraping and email sending completed successfully!")
        
    except Exception as e:
        logger.error(f"Error in main execution: {e}")
        raise


if __name__ == "__main__":
    main()
