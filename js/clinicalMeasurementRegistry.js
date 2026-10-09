// Measurement requirements, not a medical protocol or fitted response model.
// Source references support endpoint selection; no universal aesthetic targets.
export const MEASUREMENT_PROTOCOL_VERSION = 1;
export const MEASUREMENT_SOURCES = Object.freeze({
 nose:{url:'https://pmc.ncbi.nlm.nih.gov/articles/PMC7954385/',scope:'Nasal profile angles and projection ratios'},
 noseDefinitions:{url:'https://pmc.ncbi.nlm.nih.gov/articles/PMC4956864/',scope:'Alternative nasolabial-angle definitions must not be mixed'},
 lips:{url:'https://pmc.ncbi.nlm.nih.gov/articles/PMC13058167/',scope:'Study-defined lip area and angles; no preset validation'},
 lipLift:{url:'https://pmc.ncbi.nlm.nih.gov/articles/PMC9976673/',scope:'Philtral and vermilion dimensions'},
 eyes:{url:'https://pmc.ncbi.nlm.nih.gov/articles/PMC6188243/',scope:'Lid, brow and margin-reflex measurements'},
 underEye:{url:'https://pmc.ncbi.nlm.nih.gov/articles/PMC11743227/',scope:'Study-defined under-eye observer scores, not 3D depths'},
 ears:{url:'https://pmc.ncbi.nlm.nih.gov/articles/PMC11087560/',scope:'Ear protrusion and auriculocephalic angle'},
 neck:{url:'https://pmc.ncbi.nlm.nih.gov/articles/PMC10467435/',scope:'Cervicomental angle and hyomental distance'},
 breast:{url:'https://pmc.ncbi.nlm.nih.gov/articles/PMC6157947/',scope:'Projection, nipple and lower-pole position; small technique-specific cohorts'},
 body:{url:'https://www.frontiersin.org/journals/surgery/articles/10.3389/fsurg.2026.1728844/full',scope:'Post-bariatric abdomen/thigh measurements; not transferable to every body procedure'},
 wrinkles:{url:'https://onlinelibrary.wiley.com/doi/full/10.1111/jocd.70915',scope:'Wrinkle measurement approach; underlying dataset not shared'},
 scar:{url:'https://link.springer.com/article/10.1007/s00403-025-04280-1',scope:'Postsurgical scar dimensions and instrument texture/color; not acne-scar calibration'},
 hair:{url:'https://pmc.ncbi.nlm.nih.gov/articles/PMC8719948/',scope:'Hair/FU density and donor/recipient assessment'},
 dental:{url:'https://pmc.ncbi.nlm.nih.gov/articles/PMC3183664/',scope:'Gingival zenith and tooth relationships'},
 dentalColor:{url:'https://pmc.ncbi.nlm.nih.gov/articles/PMC11256871/',scope:'Calibrated dental color measurements; no RGB-to-shade inference'}
});
const methods={
 length:['calibrated_photo','metric_3d','caliper'],
 angle:['calibrated_photo','metric_3d'],
 ratio:['calibrated_photo','metric_3d'],
 area:['calibrated_photo','metric_3d'],
 volume:['metric_3d'],
 circumference:['tape','metric_3d'],
 surface:['instrument','metric_3d'],
 score:['clinical_scale'],
 density:['trichoscopy'],
 color:['spectrophotometer','calibrated_color_photo']
};
const specificMethods={
 pigmentation:['instrument'],erythema:['instrument'],skinRoughness:['instrument'],
 surfaceDisplacement:['metric_3d'],regionalDepth:['metric_3d'],lidCheekDepth:['metric_3d'],
 graftSurvival:['trichoscopy'],skinFold:['caliper'],coverageArea:['calibrated_photo','metric_3d']
};
// id | name | quantity | unit | anatomical definition
const rows=`
alarWidth|Nasal alar width|length|mm|Alare left to alare right, frontal view
nasalLength|Nasal length|length|mm|Nasion to pronasale, lateral view
nasalProjection|Nasal tip projection|length|mm|Perpendicular tip projection to the declared facial reference line, lateral view
nasolabialAngle|Nasolabial angle|angle|deg|Columellar tangent versus declared upper-lip reference; record exact definition
nasofrontalAngle|Nasofrontal angle|angle|deg|Glabellar/radix and dorsal profile tangents
nasalSymmetry|Nasal midline offset|length|mm|Tip offset from declared facial midsagittal plane
chinProjection|Chin projection|length|mm|Pogonion to declared profile reference plane
chinHeight|Chin height|length|mm|Declared mentolabial landmark to menton
jawWidth|Bigonial width|length|mm|Left to right gonion; identify actual anatomical landmarks
jawAngle|Mandibular angle|angle|deg|Declared mandibular body and ramus tangents
malarProjection|Malar projection|length|mm|Malar surface to registered reference plane
regionalVolume|Regional enclosed volume|volume|mL|Same registered ROI and closure surface at both visits; no open-mesh volume
regionalDepth|Regional contour depth|length|mm|Surface to a fixed registered reference plane, with unchanged ROI
surfaceDisplacement|Surface displacement|length|mm|Registered regional surface displacement using a declared direction and statistic
browHeight|Brow height|length|mm|Brow relative to declared canthal/orbital reference in relaxed primary gaze
mrd1|Upper margin-reflex distance|length|mm|Corneal light reflex to upper lid margin in primary gaze; not FaceMesh aperture
mrd2|Lower margin-reflex distance|length|mm|Corneal light reflex to lower lid margin in primary gaze
lidCrease|Upper lid crease height|length|mm|Upper lid margin to crease, with gaze state fixed
lidAperture|Palpebral aperture|length|mm|Upper to lower lid margin on declared vertical meridian
scleralShow|Inferior scleral show|length|mm|Inferior limbus to lower lid margin
lidCheekDepth|Lid-cheek contour depth|length|mm|Registered 3D lower-lid/cheek ROI, not eyelid aperture
cervicomentalAngle|Cervicomental angle|angle|deg|Declared submental and anterior-neck tangents, neutral neck lateral view
hyomentalLength|Hyomental length|length|mm|Declared hyoid-region and menton landmarks in neutral neck position
philtrumLength|Philtral length|length|mm|Subnasale to labrale superius at rest
upperVermilion|Upper vermilion height|length|mm|Labrale superius to upper stomion, excluding the oral opening
lowerVermilion|Lower vermilion height|length|mm|Lower stomion to labrale inferius, excluding the oral opening
lipWidth|Mouth width|length|mm|Left to right cheilion at rest
cupidDepth|Cupid’s-bow notch depth|length|mm|Central notch perpendicular to the line joining the two peaks
lipProjection|Lip projection|length|mm|Labrale to declared facial reference plane, lateral view
vermilionArea|Visible vermilion area|area|mm2|Traced upper/lower vermilion border excluding mouth opening; specify region
incisorShow|Incisor show|length|mm|Visible maxillary incisor height; distinguish rest and standardized smile
lipSymmetry|Lip asymmetry|length|mm|Difference between matching left/right vermilion measurements
oralGap|Oral opening|length|mm|Upper to lower stomion; expression confound, not filler volume
lipClosure|Lip closure assessment|score|points|Clinician-selected functional scale; not derivable from a still selfie
helixMastoid|Helix-to-mastoid distance|length|mm|Superior/middle/inferior levels must be labeled separately
auriculocephalicAngle|Auriculocephalic angle|angle|deg|Declared ear and mastoid reference planes
wrinkleDepth|Wrinkle depth|surface|mm|Calibrated surface profilometry with fixed ROI and rest/expression state
wrinkleSeverity|Wrinkle severity|score|points|Named validated scale/version and expression; never mix scales
skinRoughness|Skin roughness|surface|um|Instrument-specific roughness parameter; fixed ROI and filtering
pigmentation|Pigmentation index|surface|index|Instrument-specific calibrated index and fixed lighting/ROI
erythema|Erythema index|surface|index|Instrument-specific calibrated index; not raw red-channel intensity
scarWidth|Scar width|length|mm|Matched location and orientation on the same scar
scarHeight|Scar height|length|mm|Raised/depressed scar relative to adjacent skin; record sign convention
scarSeverity|Scar severity|score|points|Named validated scar scale/version with trained observer
breastProjection|Breast projection|length|mm|Maximum breast projection relative to declared chest plane, lateral view
upperPoleProjection|Upper-pole projection|length|mm|Fixed upper-pole landmark relative to chest reference plane
nippleHeight|Nipple level|length|mm|Signed nipple position relative to a fixed torso reference
nippleFoldDistance|Nipple-to-fold distance|length|mm|Nipple to inframammary fold along declared path; side-specific
ptosis|Ptosis assessment|score|points|Named classification and side; not inferred from person segmentation
circumference|Regional circumference|circumference|cm|Complete cross-section or tape at a fixed labeled anatomical level
contourWidth|Regional contour width|length|mm|Width at fixed anatomical level; not circumference
skinFold|Skin-fold/laxity assessment|length|mm|Clinician-measured fold at a declared site and method
buttockProjection|Buttock projection|length|mm|Maximum posterior projection to fixed pelvic reference plane
chestProjection|Chest projection|length|mm|Anterior chest projection relative to fixed thoracic reference
hairDensity|Hair shaft density|density|hairs/cm2|Count hair shafts in a calibrated recipient/donor area
fuDensity|Follicular-unit density|density|FU/cm2|Count follicular units separately from hair shafts in calibrated area
graftSurvival|Graft survival|ratio|percent|Surviving transplanted units divided by placed units in the same labeled region
hairlineHeight|Hairline height|length|mm|Hairline relative to fixed brow/glabella reference; no head tilt
coverageArea|Hair coverage area|area|cm2|Traced visible coverage with fixed hair length/style and lighting
toothWidth|Tooth width|length|mm|Maximum mesiodistal crown width of a specified tooth
toothLength|Clinical crown length|length|mm|Gingival zenith to incisal edge of specified tooth
toothRatio|Tooth width/length|ratio|ratio|Same tooth and view, width divided by clinical crown length
incisalStep|Incisal edge offset|length|mm|Edge relative to a declared occlusal/reference line
dentalGap|Interdental gap|length|mm|Specified tooth pair and measurement level
gingivalLevel|Gingival zenith level|length|mm|Specified tooth relative to declared gingival reference line
gumShow|Gingival display|length|mm|Visible gingiva during standardized smile, not rest
toothColor|Tooth color|color|Lab|Calibrated CIELAB under a fixed illuminant/observer and hydrated tooth
`.trim().split('\n');
export const CLINICAL_METRICS=Object.freeze(Object.fromEntries(rows.map(row=>{
 const [rawId,label,quantity,unit,definition]=row.split('|'),id=rawId.trim();
 return [id,Object.freeze({id,label,quantity,unit,definition,methods:specificMethods[id]||methods[quantity],
 signed:['mrd1','nasalSymmetry','surfaceDisplacement','scarHeight','nippleHeight','incisalStep','gingivalLevel','lipSymmetry'].includes(id)})];
})));
const groups=[
 [['rhinoplasty','revision-rhinoplasty'],['alarWidth','nasalLength','nasalProjection','nasolabialAngle','nasofrontalAngle','nasalSymmetry'],['nose','noseDefinitions'],'frontal and standardized lateral views'],
 [['chin-implant','chin-filler'],['chinProjection','chinHeight','regionalVolume'],[],'lateral view and registered 3D surface'],
 [['cheek-implants','cheek-filler'],['malarProjection','regionalVolume','surfaceDisplacement'],[],'registered 3D midface and standardized oblique views'],
 [['buccal-fat-removal'],['regionalDepth','regionalVolume','contourWidth'],[],'registered mid-cheek 3D surface'],
 [['facelift','mini-facelift'],['surfaceDisplacement','jawAngle','regionalVolume','scarSeverity'],['neck'],'registered lower-face 3D surface and matched profile'],
 [['brow-lift'],['browHeight','mrd1','lidCrease'],['eyes'],'relaxed brow, primary gaze and calibrated frontal view'],
 [['upper-blepharoplasty'],['mrd1','lidCrease','lidAperture','browHeight'],['eyes'],'primary gaze plus standardized lid-closed view'],
 [['lower-blepharoplasty'],['mrd2','scleralShow','lidCheekDepth','lidAperture'],['eyes','underEye'],'primary gaze and registered lower-lid 3D surface'],
 [['neck-lift'],['cervicomentalAngle','hyomentalLength','surfaceDisplacement'],['neck'],'neutral head/neck, standardized lateral view'],
 [['lip-lift'],['philtrumLength','upperVermilion','incisorShow','lipClosure','scarSeverity'],['lipLift'],'frontal/lateral at rest and standardized smile'],
 [['otoplasty'],['helixMastoid','auriculocephalicAngle'],['ears'],'bilateral ear-specific posterior/lateral views'],
 [['facial-fat-transfer'],['regionalVolume','surfaceDisplacement'],[],'registered 3D surface, separately labeled injection regions'],
 [['lip-filler'],['upperVermilion','lowerVermilion','lipWidth','cupidDepth','lipProjection','vermilionArea','regionalVolume','lipSymmetry','oralGap'],['lips'],'neutral closed-lip frontal, lateral and calibrated 3D views'],
 [['jawline-filler'],['jawWidth','jawAngle','regionalVolume'],[],'frontal/lateral and registered 3D jaw surface'],
 [['under-eye-filler'],['lidCheekDepth','regionalVolume','pigmentation'],['underEye'],'registered 3D tear-trough ROI and calibrated lighting'],
 [['temple-filler'],['regionalDepth','regionalVolume'],[],'registered 3D temporal ROI'],
 [['forehead-neuromodulator','glabella-neuromodulator','crows-feet-neuromodulator'],['wrinkleDepth','wrinkleSeverity','browHeight'],['wrinkles'],'matched rest and standardized maximum expression, separate records'],
 [['lip-flip'],['upperVermilion','incisorShow','lipClosure','oralGap'],['lipLift'],'rest and standardized smile; functional assessment separate'],
 [['chemical-peel','laser-resurfacing','microneedling','rf-microneedling','ipl','co2-laser'],['skinRoughness','pigmentation','erythema','wrinkleDepth','scarSeverity'],['scar'],'same skin ROI, calibrated illumination and instrument settings'],
 [['breast-augmentation'],['regionalVolume','breastProjection','upperPoleProjection','nippleHeight','nippleFoldDistance'],['breast'],'each breast separately; fixed posture, calibrated lateral/3D capture'],
 [['breast-lift'],['nippleHeight','nippleFoldDistance','ptosis','breastProjection','scarSeverity'],['breast'],'each breast separately; fixed posture, lateral/3D capture'],
 [['breast-reduction'],['regionalVolume','nippleHeight','nippleFoldDistance','breastProjection','scarSeverity'],['breast'],'each breast separately; lateral/3D capture'],
 [['liposuction'],['regionalVolume','circumference','contourWidth'],['body'],'treated region-specific 3D capture, fixed weight/posture/respiration'],
 [['tummy-tuck','mini-tummy-tuck'],['circumference','contourWidth','skinFold','surfaceDisplacement','scarSeverity'],['body'],'waist/abdomen labeled separately, front/profile, relaxed expiration'],
 [['brazilian-butt-lift','butt-implants'],['regionalVolume','buttockProjection','circumference'],[],'rear/profile and registered 3D pelvic surface'],
 [['mommy-makeover'],['regionalVolume','circumference','breastProjection','nippleHeight','scarSeverity'],['body','breast'],'separate component procedures and regions; combined treatment is confounded'],
 [['arm-lift','thigh-lift'],['circumference','skinFold','surfaceDisplacement','scarSeverity'],['body'],'each limb separately; fixed joint position and anatomical section'],
 [['male-breast-reduction'],['regionalVolume','chestProjection','nippleHeight'],[],'left/right chest separately, profile and registered 3D surface'],
 [['pectoral-implants'],['regionalVolume','chestProjection'],[],'left/right chest separately; same muscle activation'],
 [['calf-implants'],['regionalVolume','circumference','contourWidth'],[],'each calf separately; fixed stance and anatomical section'],
 [['fue-hair-transplant','beard-transplant','eyebrow-transplant'],['hairDensity','fuDensity','graftSurvival','coverageArea'],['hair'],'calibrated close-up/trichoscopy, fixed hair length and recipient area'],
 [['fut-hair-transplant'],['hairDensity','fuDensity','graftSurvival','coverageArea','scarWidth'],['hair'],'recipient and donor sites separately; calibrated trichoscopy'],
 [['hairline-lowering'],['hairlineHeight','coverageArea','scarWidth'],['hair'],'frontal scalp with fixed head pose and hair placement'],
 [['veneers','dental-bonding'],['toothWidth','toothLength','toothRatio','incisalStep','dentalGap','toothColor'],['dental','dentalColor'],'specified tooth, calibrated intraoral image/scan and color reference'],
 [['teeth-whitening'],['toothColor'],['dentalColor'],'same hydrated tooth, illuminant, observer and calibrated color device'],
 [['gum-contouring'],['gingivalLevel','toothLength','gumShow'],['dental'],'tooth-specific intraoral view and standardized smile'],
 [['smile-makeover'],['toothWidth','toothLength','toothRatio','gingivalLevel','gumShow','toothColor'],['dental','dentalColor'],'separate component treatments, teeth and rest/smile states']
];
export const PROCEDURE_MEASUREMENTS=Object.freeze(Object.fromEntries(groups.flatMap(([ids,metrics,sources,capture])=>ids.map(id=>[id,Object.freeze({
 id,metrics,sources,capture,clinicalValidationComplete:false,
 evidenceStatus:sources.length?'endpoint_reference_only':'proposed_endpoints_clinician_review_required',
 limitations:'Requirements are a research specification, not a complete clinical examination or validated outcome predictor. Source methods and populations may not match this procedure.'
})]))));
export function getMeasurementRequirements(id){return PROCEDURE_MEASUREMENTS[id]||null;}
