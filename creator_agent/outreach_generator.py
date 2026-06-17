import os
import sys
import json
import logging
import time

# Append listener_agent to path to access the central SQLite DB
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'listener_agent'))
from db_manager import SignalDBManager
import config

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger("CreatorAgent")

class OutreachGenerator:
    def __init__(self, db: SignalDBManager):
        self.db = db
        
        # Parse local .env manually if running locally outside of Next.js env injection
        env_path = os.path.join(os.path.dirname(__file__), '..', '.env')
        if os.path.exists(env_path):
            with open(env_path) as f:
                for line in f:
                    if '=' in line and not line.startswith('#'):
                        key, val = line.strip().split('=', 1)
                        os.environ[key] = val.strip("'").strip('"')

        # Prioritize OpenRouter if passed, fallback to standard OpenAI
        # Support both singular and plural (comma separated) for load balancing
        keys_string = os.environ.get("OPENROUTER_API_KEYS") or os.environ.get("OPENROUTER_API_KEY") or os.environ.get("OPENAI_API_KEY", "")
        self.is_openrouter = bool(os.environ.get("OPENROUTER_API_KEYS") or os.environ.get("OPENROUTER_API_KEY"))
        
        self.api_keys_array = [k.strip() for k in keys_string.split(',')] if keys_string else []
        self.current_key_idx = 0
        
        if self.api_keys_array:
            try:
                import openai
                logger.info(f"Detected {len(self.api_keys_array)} API Key(s). Load Balancer Engine running in LIVE generation mode.")
                self.mode = "LIVE"
            except ImportError:
                logger.warning("OpenAI package not installed. Running in SIMULATION mode.")
                self.mode = "SIMULATION"
        else:
            logger.warning("No OPENAI_API_KEY or OPENROUTER_API_KEY found. Running in SIMULATION mode.")
            self.mode = "SIMULATION"

    def generative_prompt(self, prospect_name, company_name, role_priority, signal_type):
        """Construct the highly targeted instruction block for the LLM."""
        return f"""
        You are an elite B2B Sales Architect closing $50k-$500k+ contracts. You are writing outbound copy to a prospect.
        Prospect Name: {prospect_name}
        Company: {company_name}
        Role Priority: {role_priority}
        Intent Trigger (Why we are emailing): {signal_type}
        
        CRITICAL STRATEGY: 
        We are executing a direct-to-End-User play. Do NOT mention equipment dealers or brokers. 
        We offer direct, pre-approved financing/leasing for their exact equipment needs based on the signals we detected.
        
        - If "BIOTECH" is in the trigger (e.g. FDA Trials / Lab Hiring): Emphasize scaling lab setups pain-free with our medical device financing.
        - If "IT_INFRA" is in the trigger (e.g. SOC2 / Co-location): Emphasize securing scalable server/endpoint financing during major rip-and-replace deployments.
        - If "HEAVY_ASSET" is in the trigger (e.g. Permits / OSHA / UCC-1): Emphasize frictionless fleet/machinery upgrades without huge CapEx.
        - If "DATA_CENTER_INFRA" in the trigger: Emphasize financing High-Density power setups, mechanical retrofits, or substation expansions over 10-year OpEx models.
        - If "SPECIALIZED_MED_ASSET" in the trigger: Emphasize medical equipment leasing for ASCs so they preserve their working capital for clinic operations.
        - If "ROBOTIC_SLAM" in the trigger: Focus purely on financing Warehouse Automation and Industry 4.0 robotics grids without major CapEx hits.
        - If "DECARBONIZATION_MEP" in the trigger: Focus on financing commercial heat pump retrofits and MEP infrastructure upgrades.
        - If "SEC_EDGAR_EQUIPMENT_CAPEX" in the trigger: Discard all empathy. Execute a "Brutally Efficient Reality Check". You are an Institutional Finance Auditor. State their recent SEC 8-K filing material event, flag the CAPEX exposure, and immediately angle how our pre-approved 84-month OpEx equipment debt structure zeroes out their capital drain.
        
        [DOGFOODING / CLIENT ACQUISITION OVERRIDE]
        - If "NEW_VP" or "FUNDING" is in the trigger (Client Acquisition Mode): Ignore equipment financing. You are pitching SalesAgentic.AI directly to them. 
          Use this exact ROI math: "A standard human SDR costs roughly $8,000/month. Our autonomous orchestration engine completely replaces a 10-person SDR squad for a flat $15k/month—an instant 80% reduction in your Customer Acquisition Cost." Play into their new role/funding mandate to scale efficiently.

        If their role is "Champion / Decision Maker", focus heavily on strategic ROI and reducing CapEx/overhead.
        If their role is "End User" or "Approver", focus on day-to-day pain eradication and ease of implementation.
        
        Format your response EXACTLY as a JSON object with three keys:
        {{
            "Email": {{"Subject": "...", "Body": "..."}},
            "LinkedIn": "Limit 300 chars, no subject. Highly casual.",
            "Voicemail": "A 30-second script for a ringless voicemail drop."
        }}
        """

    def call_llm(self, prompt: str) -> dict:
        """Call the OpenAI structured generation endpoint with Load Balancing retries."""
        if self.mode == "LIVE":
            max_retries = 3
            retries = 0
            
            while retries < max_retries:
                try:
                    current_key = self.api_keys_array[self.current_key_idx]
                    from openai import OpenAI
                    
                    # Instantiate client uniquely for the current key
                    if self.is_openrouter:
                        client = OpenAI(
                            base_url="https://openrouter.ai/api/v1",
                            api_key=current_key,
                        )
                    else:
                        client = OpenAI(api_key=current_key)
                        
                    # Custom target selection
                    model_name = os.environ.get("OPENROUTER_MODEL") or ("openai/gpt-4o" if self.is_openrouter else "gpt-4o")
                    
                    response = client.chat.completions.create(
                        model=model_name,
                        temperature=0.7,
                        messages=[
                            {"role": "system", "content": "You output strict JSON. Do not include markdown codeblocks or the word 'Subject:' inside the subject value string."},
                            {"role": "user", "content": prompt}
                        ]
                    )
                    
                    # Ensure JSON structure
                    content = response.choices[0].message.content.strip()
                    if content.startswith("```json"):
                        content = content[7:-3].strip()
                    elif content.startswith("```"):
                        content = content[3:-3].strip()
                    
                    return json.loads(content)
                    
                except Exception as e:
                    logger.warning(f"Generation Attempt {retries + 1} Failed with Active Key [Index {self.current_key_idx}]: {e}")
                    
                    # Failover: Rotate to Next Key
                    self.current_key_idx = (self.current_key_idx + 1) % len(self.api_keys_array)
                    logger.info(f"Rotating Engine to next API key -> [Index {self.current_key_idx}]...")
                    
                    retries += 1
                    time.sleep(1) # Cooldown
            
            logger.error("All load-balanced retries exhausted. The array crashed out. Falling back to simulation.")

        # Simulated fallback returning structured mock JSON
        time.sleep(1) # simulate generation latency
        return {
            "Email": {
                "Subject": "(Simulated) Following up on your hiring signal",
                "Body": "Hey [Name],\n\nSaw you guys were triggered for [Intent Signal]. We fix that.\n\nCheers,\nRobert."
            },
            "LinkedIn": "(Simulated Dm) Saw the growth at your company. Worth chatting?",
            "Voicemail": "(Simulated Voicemail) Hey, Robert here. Leaving a quick message regarding the recent growth signals..."
        }

    def run_generation_cycle(self):
        """Find unenriched decision makers, draft copy for them, and save to the DB."""
        logger.info("Initializing Generation Cycle...")
        
        targets = self.db.get_decision_makers_for_outreach()
        if not targets:
            logger.info("No queued targets available for outreach generation.")
            return

        processed_signals = set()
        
        for dm in targets:
            dm_id = dm['dm_id']
            signal_id = dm['signal_id']
            name = dm['name']
            company = dm['company_name']
            priority = dm['role_priority']
            signal_type = dm['signal_type']
            
            logger.info(f"Drafting Multi-Channel Sequence for: {name} ({priority}) at {company}")
            
            # 1. Build Prompt & Call AI
            prompt = self.generative_prompt(name, company, priority, signal_type)
            generated_assets = self.call_llm(prompt)
            
            # 2. Insert Email Draft
            if "Email" in generated_assets:
                self.db.insert_outbound_draft(
                    decision_maker_id=dm_id,
                    channel="Email",
                    subject=generated_assets["Email"].get("Subject", "Intro"),
                    body=generated_assets["Email"].get("Body", "")
                )
            
            # 3. Insert LinkedIn Draft
            if "LinkedIn" in generated_assets:
                self.db.insert_outbound_draft(
                    decision_maker_id=dm_id,
                    channel="LinkedIn",
                    subject="",
                    body=generated_assets["LinkedIn"]
                )
                
            # 4. Insert Voicemail Draft
            if "Voicemail" in generated_assets:
                self.db.insert_outbound_draft(
                    decision_maker_id=dm_id,
                    channel="Voicemail",
                    subject="",
                    body=generated_assets["Voicemail"]
                )
                
            processed_signals.add(signal_id)

        # 5. Flip the origin signal status so we don't repeat generation
        for sig_id in processed_signals:
            self.db.update_signal_status(sig_id, 'OUTREACH_GENERATED')
            
        logger.info(f"Generation Cycle Complete. {len(targets)} targets successfully drafted.")

if __name__ == "__main__":
    db_manager = SignalDBManager(config.DB_PATH)
    creator = OutreachGenerator(db_manager)
    creator.run_generation_cycle()
