#!/usr/bin/env python3
"""Seed data/topics/backlog.json: video topics from IMO + ADMIRALTY (UKHO) and mariners' recurring questions.
Each topic carries a starting page; the desk must still verify every fact on the primary source before scripting.
Priority (0-100) = PSC deficiency weight + exam/question frequency + regulatory freshness + safety criticality + visual potential."""
import json, re, sys, os

IMO = {
  'safety': 'https://www.imo.org/en/OurWork/Safety/Pages/default.aspx',
  'env': 'https://www.imo.org/en/OurWork/Environment/Pages/Default.aspx',
  'security': 'https://www.imo.org/en/OurWork/Security/Pages/Default.aspx',
  'human': 'https://www.imo.org/en/OurWork/HumanElement/Pages/Default.aspx',
  'conv': 'https://www.imo.org/en/About/Conventions/Pages/ListOfConventions.aspx',
  'media': 'https://www.imo.org/en/MediaCentre/Pages/Default.aspx',
}
ADM = {
  'avcs': 'https://www.admiralty.co.uk/charts/digital-charts/admiralty-vector-chart-service',
  'charts': 'https://www.admiralty.co.uk/charts',
  'routeing': 'https://www.admiralty.co.uk/charts/planning-charts/routeing-charts',
  'security': 'https://www.admiralty.co.uk/charts/planning-charts/maritime-security-charts',
  'lights': 'https://www.admiralty.co.uk/publications/admiralty-list-lights-and-fog-signals',
  'radio': 'https://www.admiralty.co.uk/publications/publications-and-reference-guides/admiralty-list-of-radio-signals',
  'tides': 'https://www.admiralty.co.uk/publications/publications-and-reference-guides/admiralty-tide-tables',
  'sd': 'https://www.admiralty.co.uk/publications/publications-and-reference-guides/admiralty-sailing-directions',
  'np100': 'https://www.admiralty.co.uk/publications/publications-and-reference-guides/admiralty-mariners-handbook',
  'np136': 'https://www.admiralty.co.uk/publications/publications-and-reference-guides/ocean-passages-for-the-world',
  'ecdisref': 'https://www.admiralty.co.uk/publications/publications-and-reference-guides/ECDIS-and-ENC-reference-publications',
  'symbology': 'https://www.admiralty.co.uk/guide-enc-symbology-used-ecdis',
  'almanac': 'https://www.admiralty.co.uk/publications/astronomical-publications/the-nautical-almanac',
  'streams': 'https://www.admiralty.co.uk/publications/miscellaneous-tidal-publications/admiralty-tidal-stream-atlases',
  'np120': 'https://www.admiralty.co.uk/publications/miscellaneous-tidal-publications/admiralty-manual-of-tides',
  'msi': 'https://msi.admiralty.co.uk/',
  'nm': 'https://msi.admiralty.co.uk/NoticesToMariners/Weekly',
  'rnw': 'https://msi.admiralty.co.uk/RadioNavigationalWarnings',
  'hnote': 'https://www.admiralty.co.uk/maritime-safety-information/hydrographic-notes',
  'sri': 'https://www.admiralty.co.uk/maritime-safety-information/security-related-information-to-mariners',
  's100': 'https://www.admiralty.co.uk/s-100-shaping-future-navigation',
  's100qa': 'https://www.admiralty.co.uk/news/s-100-your-questions-answered',
}
# weights per tag
W = {'psc': 22, 'exam': 18, 'new': 22, 'critical': 20, 'faq': 14, 'accident': 16, 'visual': 8}

# stream, pillar, level, title, start keys, tags
T = [
 # ---------- DECK: ADMIRALTY / navigation ----------
 ('deck','equipment','L2','ENC vs raster charts: what ECDIS really shows','avcs,ecdisref','exam,faq,visual'),
 ('deck','equipment','L2','ECDIS safety contour vs safety depth','symbology,ecdisref','exam,critical,psc,visual'),
 ('deck','equipment','L3','ECDIS display base, standard and all-other display','symbology','exam,visual'),
 ('deck','equipment','L2','ENC isolated danger symbol and why it matters','symbology','critical,visual'),
 ('deck','equipment','L3','ECDIS route check: how to run it properly','ecdisref','psc,critical,exam'),
 ('deck','equipment','L3','ECDIS alarms vs indications','ecdisref,symbology','exam,psc'),
 ('deck','equipment','L2','ENC updating: base, update and re-issue','avcs','psc,faq'),
 ('deck','equipment','L3','AVCS permits and keeping ENCs up to date','avcs','faq'),
 ('deck','equipment','L3','Over-scale and under-scale ENC warnings','symbology','critical,exam,visual'),
 ('deck','equipment','L2','ENC SCAMIN: why features disappear when you zoom out','symbology','faq,visual'),
 ('deck','equipment','L4','S-100: what changes after S-57 ENCs','s100,s100qa','new,faq'),
 ('deck','equipment','L3','S-102 high-resolution bathymetry explained','s100','new,visual'),
 ('deck','equipment','L3','S-104 water level and S-111 surface currents','s100','new,visual'),
 ('deck','equipment','L4','Dual-fuel ECDIS: running S-57 and S-101 together','s100qa','new'),
 ('deck','terminology','L1','Chart datum vs height datum','np120,tides','exam,visual'),
 ('deck','terminology','L1','LAT, MLWS and why charts use the lowest tide','np120','exam,visual'),
 ('deck','equipment','L2','Using Admiralty Tide Tables: standard and secondary ports','tides','exam'),
 ('deck','equipment','L2','Tidal stream atlases and tidal diamonds','streams','exam,visual'),
 ('deck','terminology','L2','Spring and neap tides: the moon and the sun','np120','exam,visual'),
 ('deck','equipment','L2','Admiralty List of Lights: reading a light entry','lights','exam,visual'),
 ('deck','terminology','L1','Light characteristics: Fl, Oc, Iso, Q','lights','exam,visual'),
 ('deck','terminology','L2','Nominal, luminous and geographical range of a light','lights','exam,visual'),
 ('deck','equipment','L2','Admiralty List of Radio Signals: which volume for what','radio','exam,faq'),
 ('deck','equipment','L2','Sailing Directions: what pilots books tell you','sd','faq'),
 ('deck','equipment','L3','Ocean Passages for the World: planning an ocean route','np136','exam,visual'),
 ('deck','equipment','L3','Routeing charts: winds, currents and load line zones','routeing','exam,visual'),
 ('deck','equipment','L2','Mariner\'s Handbook NP100: the officer\'s reference','np100','faq'),
 ('deck','equipment','L2','Weekly Notices to Mariners: how corrections work','nm','psc,exam'),
 ('deck','equipment','L2','Temporary and Preliminary notices (T&P)','nm','psc,exam'),
 ('deck','equipment','L2','Radio navigational warnings: NAVAREA, coastal, local','rnw,msi','exam,critical'),
 ('deck','equipment','L3','NAVTEX and SafetyNET: getting MSI on board','msi,radio','exam,psc'),
 ('deck','equipment','L3','Maritime security charts and high-risk areas','security,sri','critical,new'),
 ('deck','equipment','L3','Hydrographic Notes: reporting chart errors','hnote','faq'),
 ('deck','equipment','L2','Nautical Almanac: what officers still use it for','almanac','exam'),
 ('deck','navigation','L2','Compass error by sun azimuth','almanac','exam,visual'),
 ('deck','navigation','L2','Passage planning: appraisal, planning, execution, monitoring','np100,sd','exam,psc,critical'),
 ('deck','navigation','L3','No-go areas and safety margins in a passage plan','ecdisref','psc,critical,visual'),
 ('deck','navigation','L3','Parallel indexing on radar','np100','exam,visual'),
 ('deck','navigation','L3','Squat: why ships sink deeper at speed','np100','critical,accident,visual'),
 ('deck','navigation','L3','Bank effect and ship interaction in channels','np100','accident,visual'),
 ('deck','navigation','L2','Wheel-over point and turning circles','np100','exam,visual'),
 ('deck','navigation','L3','Anchoring: scope of chain and holding ground','np100','exam,visual'),
 ('deck','navigation','L3','Dragging anchor: early signs and actions','np100','accident,critical,visual'),
 ('deck','navigation','L2','Pilot boarding: ladder rigging rules','safety','psc,critical,accident,visual'),
 ('deck','navigation','L3','Master-pilot exchange: what must be discussed','safety','exam,accident'),
 ('deck','navigation','L2','Restricted visibility: bridge actions','safety','exam,critical,visual'),
 ('deck','navigation','L2','Heavy weather preparations on deck','np100','critical,visual'),
 ('deck','navigation','L3','Tropical revolving storms: avoiding the dangerous semicircle','np100,routeing','exam,critical,visual'),
 ('deck','navigation','L3','Ice navigation and the Polar Code basics','safety,np100','new,visual'),
 ('deck','navigation','L2','Traffic separation schemes and Rule 10','safety','exam,visual'),
 ('deck','navigation','L2','Ship reporting systems and VTS','radio','exam'),
 ('deck','navigation','L2','AIS: what it shows and what it does not','safety','faq,critical'),
 ('deck','navigation','L3','Radar: CPA/TCPA and trial manoeuvre','safety','exam,visual'),
 ('deck','navigation','L2','Radar range scales and pulse length','safety','exam'),
 ('deck','navigation','L2','Bridge resource management: closed-loop communication','human','accident,exam'),
 ('deck','navigation','L2','Lookout: why Rule 5 is broken most often','safety','accident,exam'),
 ('deck','navigation','L3','BNWAS: bridge watch alarm stages','safety','psc'),
 ('deck','navigation','L3','Gyro and magnetic compass errors','safety','exam,visual'),
 ('deck','navigation','L3','GNSS jamming and spoofing: what to watch for','safety,sri','new,critical'),
 # COLREG rules (one per video)
 *[('deck','colreg','L1' if r<10 else 'L2', t,'safety','exam,critical,visual') for r,t in [
   (5,'COLREG Rule 5: Look-out'),(6,'COLREG Rule 6: Safe speed'),(7,'COLREG Rule 7: Risk of collision'),
   (8,'COLREG Rule 8: Action to avoid collision'),(9,'COLREG Rule 9: Narrow channels'),(10,'COLREG Rule 10: Traffic separation schemes'),
   (16,'COLREG Rule 16: Action by give-way vessel'),(17,'COLREG Rule 17: Action by stand-on vessel'),(18,'COLREG Rule 18: Responsibilities between vessels'),
   (19,'COLREG Rule 19: Conduct in restricted visibility'),(23,'COLREG Rule 23: Power-driven vessel lights'),(24,'COLREG Rule 24: Towing and pushing lights'),
   (26,'COLREG Rule 26: Fishing vessel lights'),(27,'COLREG Rule 27: NUC and RAM lights'),(28,'COLREG Rule 28: Constrained by draught'),
   (30,'COLREG Rule 30: Anchored and aground lights'),(32,'COLREG Rules 32-34: Sound and manoeuvring signals'),(35,'COLREG Rule 35: Sound signals in restricted visibility'),
   (37,'COLREG Annex IV: Distress signals')]],
 # Cargo / seamanship
 ('deck','deck','L2','Mooring line snap-back: reading the danger zone','safety','accident,critical,visual'),
 ('deck','deck','L3','Mooring winch brakes and brake rendering','safety','accident,psc'),
 ('deck','deck','L2','Hatch cover weathertightness checks','safety','psc,visual'),
 ('deck','deck','L3','Container lashing and parametric rolling','safety','accident,visual'),
 ('deck','deck','L3','Solid bulk cargo liquefaction (IMSBC)','safety','accident,critical,new'),
 ('deck','deck','L3','Grain cargo: shifting and stability','safety','exam,visual'),
 ('deck','deck','L3','Dangerous goods: IMDG classes in one minute','safety','exam,faq'),
 ('deck','deck','L3','Tanker cargo: inert gas system basics','safety','exam,critical'),
 ('deck','deck','L2','Stability basics: GM, GZ and free surface','safety','exam,visual'),
 ('deck','deck','L3','Load lines: the Plimsoll mark explained','conv','exam,visual'),
 ('deck','deck','L3','Ballast water exchange vs treatment (D-1 vs D-2)','env','psc,new'),
 # ---------- ENGINE ----------
 ('engine','engine','L2','Main engine starting air system','safety','exam,visual'),
 ('engine','engine','L3','Crankcase explosion: causes and relief doors','safety','exam,critical,accident,visual'),
 ('engine','engine','L3','Oil mist detector: how it saves the engine','safety','exam,critical'),
 ('engine','engine','L3','Scavenge fire: symptoms and actions','safety','exam,critical,accident,visual'),
 ('engine','engine','L2','Turbocharger surging','safety','exam,visual'),
 ('engine','engine','L3','Fuel injection and injector problems','safety','exam'),
 ('engine','engine','L3','Cylinder lubrication and liner wear','safety','exam'),
 ('engine','engine','L2','Jacket cooling water system','safety','exam,visual'),
 ('engine','engine','L3','Exhaust gas boiler soot fires','safety','accident,critical'),
 ('engine','engine','L3','Boiler water tests and treatment','safety','exam'),
 ('engine','engine','L2','Fuel oil purifier: gravity disc and interface','safety','exam,visual'),
 ('engine','engine','L3','Fuel changeover for ECA: safe procedure','env','psc,new,critical'),
 ('engine','engine','L3','Fuel compatibility and stability problems','env','new,accident'),
 ('engine','engine','L3','Bunkering safety: overflow and sampling','env','psc,critical'),
 ('engine','engine','L2','Steering gear: testing and emergency steering drill','safety','psc,exam,critical'),
 ('engine','engine','L2','Fixed CO2 system in the engine room','safety','psc,critical,visual'),
 ('engine','engine','L2','Emergency fire pump test','safety','psc,critical'),
 ('engine','engine','L2','Quick-closing valves and fuel shut-offs','safety','psc,critical'),
 ('engine','engine','L3','Air compressor safety and relief valves','safety','exam'),
 ('engine','engine','L3','Refrigeration cycle on board','safety','exam,visual'),
 ('engine','engine','L3','Fresh water generator: how vacuum makes water','safety','exam,visual'),
 ('engine','engine','L3','Sewage treatment plant and MARPOL Annex IV','env','psc'),
 ('engine','engine','L3','Incinerator and MARPOL Annex V garbage','env','psc'),
 ('engine','engine','L2','Oil record book Part I entries','env','psc,critical'),
 ('engine','engine','L3','Bilge alarms and 15 ppm monitoring tampering','env','psc,accident'),
 ('engine','engine','L4','SCR and EGR for Tier III NOx','env','new,exam'),
 ('engine','engine','L4','Scrubbers: open loop vs closed loop','env','new,faq'),
 ('engine','engine','L4','LNG as fuel: IGF Code essentials','env','new'),
 ('engine','engine','L4','Methanol and ammonia fuel: crew safety','env','new,critical'),
 ('engine','engine','L4','EEXI and CII: what engineers must know','env','new,faq'),
 ('engine','engine','L3','Shaft power limitation (ShaPoLi)','env','new'),
 ('engine','engine','L2','Electrical: insulation resistance testing','safety','exam'),
 ('engine','engine','L3','Generator paralleling and synchroscope','safety','exam,visual'),
 ('engine','engine','L3','Preferential tripping and blackout recovery','safety','exam,critical,psc'),
 ('engine','engine','L3','Earth faults on an insulated system','safety','exam'),
 ('engine','engine','L2','Emergency generator: starting and load test','safety','psc,critical'),
 ('engine','engine','L3','Unattended machinery space (UMS) checks','safety','exam'),
 ('engine','engine','L3','Lock-out tag-out on machinery','safety','accident,critical'),
 ('engine','engine','L3','Hot work in the engine room','safety','accident,critical'),
 ('engine','engine','L3','High-pressure fuel pipe leaks and jacketed pipes','safety','accident,critical'),
 # ---------- SAFETY / REGULATION / PROFESSIONAL ----------
 ('safety','safety','L1','Fire triangle and classes of fire on ships','safety','psc,exam,visual'),
 ('safety','safety','L2','Fire doors and fire dampers: why PSC detains','safety','psc,critical'),
 ('safety','safety','L2','Fire detection systems and testing','safety','psc'),
 ('safety','safety','L2','Breathing apparatus and EEBD checks','safety','psc,critical'),
 ('safety','safety','L2','Fire drills that actually work','safety','psc,exam'),
 ('safety','equipment','L2','Lifeboat on-load release hooks','safety','psc,accident,critical,visual'),
 ('safety','equipment','L2','Liferaft: hydrostatic release unit','safety','psc,exam,visual'),
 ('safety','equipment','L1','Lifejackets and immersion suits','safety','psc,exam'),
 ('safety','equipment','L2','Rescue boat launching and recovery','safety','accident,critical'),
 ('safety','equipment','L2','EPIRB and SART: how rescuers find you','safety','exam,psc'),
 ('safety','equipment','L2','GMDSS sea areas A1 to A4','radio,safety','exam'),
 ('safety','equipment','L3','Abandon ship drill under SOLAS','safety','psc,exam'),
 ('safety','safety','L2','Man overboard: Williamson turn','safety','exam,critical,visual'),
 ('safety','safety','L3','Enclosed space rescue drills','safety','accident,critical,psc'),
 ('safety','safety','L2','Working aloft and over the side','safety','accident'),
 ('safety','safety','L2','Permit to work system','safety','accident,exam'),
 ('safety','safety','L2','Risk assessment on board','safety','exam,psc'),
 ('safety','safety','L2','Near-miss reporting and just culture','human','faq'),
 ('safety','regulation','L2','SOLAS chapters in one minute','conv','exam,faq'),
 ('safety','regulation','L2','MARPOL annexes I to VI explained','conv,env','exam,faq'),
 ('safety','regulation','L3','MARPOL Annex VI sulphur limits and ECAs','env','psc,new'),
 ('safety','regulation','L3','Garbage management plan and record book','env','psc'),
 ('safety','regulation','L3','Ballast Water Management Convention','env','psc,new'),
 ('safety','regulation','L3','Biofouling guidelines','env','new'),
 ('safety','regulation','L2','STCW: certificates of competency explained','conv','faq,exam'),
 ('safety','regulation','L3','STCW review: what may change','human','new,faq'),
 ('safety','regulation','L2','MLC 2006: seafarer employment agreement','conv','psc,faq'),
 ('safety','regulation','L2','MLC: wages, repatriation and shore leave','conv','psc,faq'),
 ('safety','regulation','L3','MLC: food, catering and accommodation','conv','psc'),
 ('safety','regulation','L3','ISM Code: the DPA and the SMS','conv','psc,exam'),
 ('safety','regulation','L3','ISM non-conformities that lead to detention','conv','psc,critical'),
 ('safety','regulation','L3','ISPS Code: security levels 1-2-3','security','exam,psc'),
 ('safety','regulation','L3','Ship security drills and the SSP','security','psc'),
 ('safety','regulation','L3','Piracy and armed robbery: BMP essentials','security,sri','critical,new'),
 ('safety','regulation','L3','Port State Control: how an inspection runs','safety','psc,faq'),
 ('safety','regulation','L3','Paris and Tokyo MoU: ship risk profile','safety','psc,faq'),
 ('safety','regulation','L3','Concentrated inspection campaigns (CIC)','safety','psc,new'),
 ('safety','regulation','L4','IMO Net-Zero Framework: what it means on board','env','new,faq'),
 ('safety','regulation','L4','GHG strategy and fuel lifecycle (LCA)','env','new'),
 ('safety','regulation','L3','Polar Code: certificates and manuals','safety','new'),
 ('safety','regulation','L3','IMO instruments: convention, code, resolution, circular','conv','faq'),
 ('safety','regulation','L3','Amendments and tacit acceptance: how IMO rules enter force','conv','faq,new'),
 ('safety','regulation','L4','MASS: autonomous ships and the IMO code','media','new,faq'),
 ('safety','professional','L1','Life as a cadet: first week on board','human','faq'),
 ('safety','professional','L1','Ranks on a merchant ship','human','faq'),
 ('safety','professional','L2','Seafarer mental health and fatigue','human','critical,faq'),
 ('safety','professional','L2','Harassment and bullying: reporting on board','human','new,faq'),
 ('safety','professional','L2','Seafarers abandonment: rights and help','human','new,faq'),
 ('safety','professional','L3','Handover between watches and officers','human','accident,exam'),
 ('safety','terminology','L1','Port, starboard, fore and aft','safety','faq,visual'),
 ('safety','terminology','L1','Deadweight vs gross tonnage','conv','exam,faq'),
 ('safety','terminology','L1','Draft marks and reading the draught','safety','exam,visual'),
]

PILLAR = {'equipment':'equipment','terminology':'terminology','navigation':'deck','colreg':'colreg','deck':'deck','engine':'engine','safety':'safety','regulation':'regulation','professional':'professional'}

def url(keys):
    out=[]
    for k in keys.split(','):
        out.append(ADM.get(k) or IMO.get(k))
    return [u for u in out if u]

def slug(s): return re.sub(r'[^a-z0-9]+','-',s.lower()).strip('-')[:60]

def main(out):
    old = {}
    if os.path.exists(out):
        for t in json.load(open(out))['topics']: old[t['id']] = t
    topics=[]
    for stream,pillar,level,title,keys,tags in T:
        tg=tags.split(',')
        score=min(100, 20+sum(W.get(x,0) for x in tg))
        tid=slug(title)
        t={'id':tid,'title':title,'stream':stream,'pillar':PILLAR[pillar],'level':level,'priority':score,'tags':tg,
           'startFrom':url(keys),'origin':'seed: imo.org / admiralty.co.uk + PSC deficiency stats + oral exam questions','status':'open'}
        if tid in old: t.update({k:old[tid][k] for k in ('status','usedBy','usedAt','priority') if k in old[tid]})
        topics.append(t)
    # keep topics added later by the scout
    seen={t['id'] for t in topics}
    topics += [t for i,t in old.items() if i not in seen]
    topics.sort(key=lambda t:(-t['priority'], t['stream'], t['id']))
    doc={'about':'HeyMariner video topic backlog. Daily desk takes the highest-priority open topic per stream; the weekly scout adds and re-scores topics. Verify every fact on the primary source before scripting.',
         'weights':W,'topics':topics}
    json.dump(doc, open(out,'w'), indent=1, ensure_ascii=False)
    from collections import Counter
    print(len(topics), 'topics', dict(Counter(t['stream'] for t in topics)))

main(sys.argv[1] if len(sys.argv)>1 else 'data/topics/backlog.json')
