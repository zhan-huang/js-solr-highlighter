import { isStopWord, highlightByQuery } from './index.js'

describe('tests for function highlightByQuery derived by faults found in Europe PMC', () => {
  const options = {
    validFields: [
      'ABBR',
      'ABSTRACT',
      'ACCESSION_ID',
      'ACCESSION_TYPE',
      'ACK_FUND',
      'AFF',
      'ANNOTATION_PROVIDER',
      'ANNOTATION_TYPE',
      'APPENDIX',
      'ARXPR_PUBS',
      'AUTH',
      'AUTHORID',
      'AUTHORID_TYPE',
      'AUTHOR_ROLES',
      'AUTH_CON',
      'AUTH_FIRST',
      'AUTH_LAST',
      'AUTH_MAN',
      'AUTH_MAN_ID',
      'BACK',
      'BACK_NOREF',
      'BODY',
      'BOOK_ID',
      'CASE',
      'CHEBITERM',
      'CHEBITERM_ID',
      'CHEBI_PUBS',
      'CHEM',
      'CHEMBL_PUBS',
      'CITED',
      'CITES',
      'COMP_INT',
      'CONCL',
      'CRD_LINKS',
      'CREATION_DATE',
      'DATA_AVAILABILITY',
      'DISCUSS',
      'DISEASE',
      'DISEASE_ID',
      'DOI',
      'ED',
      'EMBARGO_DATE',
      'EMBL_PUBS',
      'EPMC_AUTH_MAN',
      'ESSN',
      'EXPERIMENTAL_METHOD',
      'EXPERIMENTAL_METHOD_ID',
      'EXT_ID',
      'E_PDATE',
      'FIG',
      'FIRST_IDATE',
      'FIRST_IDATE_D',
      'FIRST_PDATE',
      'FT_CDATE',
      'FT_CDATE_D',
      'FULLTEXT_SITE',
      'GENE_PROTEIN',
      'GOTERM',
      'GOTERM_ID',
      'GRANT_AGENCY',
      'GRANT_AGENCY_ID',
      'GRANT_ID',
      'HAS_ARXPR',
      'HAS_BOOK',
      'HAS_CHEBI',
      'HAS_CHEMBL',
      'HAS_CRD',
      'HAS_DATA',
      'HAS_DOI',
      'HAS_EMBL',
      'HAS_FT',
      'HAS_FULLTEXT',
      'HAS_FULLTEXTDATA',
      'HAS_INTACT',
      'HAS_INTERPRO',
      'HAS_LABSLINKS',
      'HAS_OMIM',
      'HAS_PDB',
      'HAS_PDF',
      'HAS_PREPRINT',
      'HAS_PRIDE',
      'HAS_PUBLISHED_VERSION',
      'HAS_REFLIST',
      'HAS_SUPPL',
      'HAS_TM',
      'HAS_UNIPROT',
      'HAS_XREFS',
      'INDEX_DATE',
      'INTACT_PUBS',
      'INTERPRO_PUBS',
      'INTRO',
      'INVESTIGATOR',
      'IN_EPMC',
      'IN_PMC',
      'ISBN',
      'ISSN',
      'ISSUE',
      'IS_SCANNED',
      'JOURNAL',
      'JOURNAL_ID',
      'JRNL_ISS_ID',
      'KEYWORD', //
      'KW',
      'LABS_PUBS',
      'LANG',
      'LICENSE',
      'LPAGE',
      'METHODS',
      'NIH_AUTH_MAN',
      'OMIM_PUBS',
      'OMIM_TYPE',
      'OPEN_ACCESS',
      'ORGANISM',
      'ORGANISM_ID',
      'ORG_ID',
      'OTHER', //
      'PARENT_TITLE', //,
      'PATENTS',
      'PDB_PUBS',
      'PDF',
      'PMCID',
      'PMC_DOI',
      'PRIDE_PUBS',
      'PUBDATE',
      'PUBLISHER',
      'PUB_TYPE',
      'PUB_YEAR',
      'P_PDATE',
      'QN1',
      'QN2',
      'REF',
      'REFFED_BY',
      'RESOURCE_NAME',
      'RESULTS',
      'SB',
      'SERIES_NAME',
      'SHARD',
      'SPAGE',
      'SRC',
      'SUPPL',
      'TABLE',
      'TITLE',
      'UNIPROT_PUBS',
      'UPDATE_DATE',
      'VOLUME',
      '_version_',
      'text_hl',
      'text_synonyms'
    ],
    highlightedFields: ['TITLE', '<implicit>']
  }

  test('methylation test', () => {
    const query = 'methylation test'
    const content =
      'epiCaPture: A Urine DNA Methylation Test for Early Detection of Aggressive Prostate Cancer.'
    const received = highlightByQuery(query, content, options)
    const expected =
      'epiCaPture: A Urine DNA <span id="highlight-0" class="highlight">Methylation</span> <span id="highlight-1" class="highlight">Test</span> for Early Detection of Aggressive Prostate Cancer.'
    expect(received).toBe(expected)
  })

  test('TITLE:blood', () => {
    const query = 'TITLE:blood'
    const content =
      'A molecular map of lymph node blood vascular endothelium at single cell resolution'
    const received = highlightByQuery(query, content, options)
    const expected =
      'A molecular map of lymph node <span id="highlight-0" class="highlight">blood</span> vascular endothelium at single cell resolution'
    expect(received).toBe(expected)
  })

  test('"electrode array"', () => {
    const query = '"electrode array"'
    const content =
      'Towards emerging EEG applications: a novel printable flexible Ag/AgCl dry electrode array for robust recording of EEG signals at forehead sites.'
    const received = highlightByQuery(query, content, options)
    const expected =
      'Towards emerging EEG applications: a novel printable flexible Ag/AgCl dry <span id="highlight-0" class="highlight">electrode array</span> for robust recording of EEG signals at forehead sites.'
    expect(received).toBe(expected)
  })

  test('ACK_FUND:"Prostate Cancer UK"', () => {
    const query = 'ACK_FUND:"Prostate Cancer UK"'
    const content =
      'PIM kinase inhibition: co-targeted therapeutic approaches in prostate cancer.'
    const received = highlightByQuery(query, content, options)
    const expected =
      'PIM kinase inhibition: co-targeted therapeutic approaches in prostate cancer.'
    expect(received).toBe(expected)
  })

  test('ACK_FUND:Prostate Cancer UK', () => {
    const query = 'ACK_FUND:"Prostate Cancer UK"'
    const content =
      'MIFlowCyt-EV: a framework for standardized reporting of extracellular vesicle flow cytometry experiments.'
    const received = highlightByQuery(query, content, options)
    const expected =
      'MIFlowCyt-EV: a framework for standardized reporting of extracellular vesicle flow cytometry experiments.'
    expect(received).toBe(expected)
  })

  test('blood in the brain', () => {
    const query = 'blood in the brain'
    const content =
      'Autophagy-mediated occludin degradation contributes to blood-brain barrier disruption during ischemia in bEnd.3 brain endothelial cells and rat ischemic stroke models.'
    const received = highlightByQuery(query, content, options)
    const expected =
      'Autophagy-mediated occludin degradation contributes to <span id="highlight-0" class="highlight">blood</span>-<span id="highlight-1" class="highlight">brain</span> barrier disruption during ischemia in bEnd.3 <span id="highlight-2" class="highlight">brain</span> endothelial cells and rat ischemic stroke models.'
    expect(received).toBe(expected)
  })

  test('bloo', () => {
    const query = 'bloo'
    const content = 'The Changing Role of Phonology in Reading Development.'
    const received = highlightByQuery(query, content, options)
    const expected = 'The Changing Role of Phonology in Reading Development.'
    expect(received).toBe(expected)
  })

  test('cancer AND blood', () => {
    const query = 'cancer AND blood'
    const content =
      'Platelet Volume Is Reduced In Metastasing Breast Cancer: Blood Profiles Reveal Significant Shifts.'
    const received = highlightByQuery(query, content, options)
    const expected =
      'Platelet Volume Is Reduced In Metastasing Breast <span id="highlight-0" class="highlight">Cancer</span>: <span id="highlight-1" class="highlight">Blood</span> Profiles Reveal Significant Shifts.'
    expect(received).toBe(expected)
  })

  test('cancer OR blood', () => {
    const query = 'cancer OR blood'
    const content = 'New cancer blood test developed.'
    const received = highlightByQuery(query, content, options)
    const expected =
      'New <span id="highlight-0" class="highlight">cancer</span> <span id="highlight-1" class="highlight">blood</span> test developed.'
    expect(received).toBe(expected)
  })

  test('cancer NOT blood', () => {
    const query = 'cancer NOT blood'
    const content =
      'Efficacy of kinesio taping in early stage breast cancer associated lymphedema: A randomized single blinded study.'
    const received = highlightByQuery(query, content, options)
    const expected =
      'Efficacy of kinesio taping in early stage breast <span id="highlight-0" class="highlight">cancer</span> associated lymphedema: A randomized single blinded study.'
    expect(received).toBe(expected)
  })

  test('(ACK_FUND:"Prostate Cancer UK") biopsy', () => {
    const query = '(ACK_FUND:"Prostate Cancer UK") biopsy'
    const content =
      'A multicentre parallel-group randomised trial assessing multiparametric MRI characterisation and image-guided biopsy of prostate in men suspected of having prostate cancer: MULTIPROS study protocol.'
    const received = highlightByQuery(query, content, options)
    const expected =
      'A multicentre parallel-group randomised trial assessing multiparametric MRI characterisation and image-guided <span id="highlight-0" class="highlight">biopsy</span> of prostate in men suspected of having prostate cancer: MULTIPROS study protocol.'
    expect(received).toBe(expected)
  })

  test('(blood test)', () => {
    const query = '(blood test)'
    const content =
      '[Predictive values of routine blood test results for iron deficiency in children].'
    const received = highlightByQuery(query, content, options)
    const expected =
      '[Predictive values of routine <span id="highlight-0" class="highlight">blood</span> <span id="highlight-1" class="highlight">test</span> results for iron deficiency in children].'
    expect(received).toBe(expected)
  })

  test('(ACK_FUND:"Prostate Cancer UK") NOT (grant_agency:"Prostate Cancer UK" AND SRC:med)', () => {
    const query =
      '(ACK_FUND:"Prostate Cancer UK") NOT (grant_agency:"Prostate Cancer UK" AND SRC:med)'
    const content =
      'PIM kinase inhibition: co-targeted therapeutic approaches in prostate cancer.'
    const received = highlightByQuery(query, content, options)
    const expected =
      'PIM kinase inhibition: co-targeted therapeutic approaches in prostate cancer.'
    expect(received).toBe(expected)
  })

  test('cancer cancer', () => {
    const query = 'cancer cancer'
    const content =
      'Diabetes and Cancer: Cancer Should Be Screened in Routine Diabetes Assessment.'
    const received = highlightByQuery(query, content, options)
    const expected =
      'Diabetes and <span id="highlight-2" class="highlight"><span id="highlight-0" class="highlight">Cancer</span></span>: <span id="highlight-3" class="highlight"><span id="highlight-1" class="highlight">Cancer</span></span> Should Be Screened in Routine Diabetes Assessment.'
    expect(received).toBe(expected)
  })

  test('HAS_ABSTRACT:Y AND blood', () => {
    const query = 'HAS_ABSTRACT:Y AND blood'
    const content =
      'Genetic disruption of the Blood Brain Barrier leads to protective barrier formation at the Glia Limitans'
    const received = highlightByQuery(query, content, options)
    const expected =
      'Genetic disruption of the <span id="highlight-0" class="highlight">Blood</span> Brain Barrier leads to protective barrier formation at the Glia Limitans'
    expect(received).toBe(expected)
  })

  test('Evidence that intentions based on attitudes better predict behavior than intentions based on subjective norms', () => {
    const query =
      'Evidence that intentions based on attitudes better predict behavior than intentions based on subjective norms'
    const content =
      'The Campbell Paradigm as a Behavior-Predictive Reinterpretation of the Classical Tripartite Model of Attitudes.'
    const received = highlightByQuery(query, content, options)
    const expected =
      'The Campbell Paradigm as a <span id="highlight-2" class="highlight">Behavior</span>-Predictive Reinterpretation of the Classical Tripartite Model of <span id="highlight-0" class="highlight">Attitudes</span>.'
    expect(received).toBe(expected)
  })

  test('A theory-based study of doctors', () => {
    const query = 'A theory-based study of doctors'
    const content =
      "A theory-based study of doctors' intentions to engage in professional behaviours."
    const received = highlightByQuery(query, content, options)
    const expected =
      'A <span id="highlight-0" class="highlight">theory-based</span> <span id="highlight-1" class="highlight">study</span> of <span id="highlight-2" class="highlight">doctors</span>\' intentions to engage in professional behaviours.'
    expect(received).toBe(expected)
  })

  test('above', () => {
    const query = 'above'
    const content =
      'High definition ultrasound imaging of the individual elements of the brachial plexus above the clavicle.'
    const received = highlightByQuery(query, content, options)
    const expected =
      'High definition ultrasound imaging of the individual elements of the brachial plexus <span id="highlight-0" class="highlight">above</span> the clavicle.'
    expect(received).toBe(expected)
  })

  // throw errors but work; improve later
  // test('PUBLISHER:"[Institute for Quality and Efficiency in Health Care (IQWiG)][Cologne (Germany)]"', () => {
  //   const query = 'PUBLISHER:"[Institute for Quality and Efficiency in Health Care (IQWiG)][Cologne (Germany)]"'
  //   const content = 'Relationship between volume of services and quality of treatment outcome for surgical treatment of lung carcinoma IQWiG Reports – Commission No. V18-03'
  //   const received = highlightByQuery(query, content, options)
  //   const expected = ''
  //   expect(received).toThrowError(/SyntaxError/)
  // })

  // test('PUBLISHER:"[Canadian Agency for Drugs and Technologies in Health][Ottawa (ON)]', () => {
  //   const query = 'PUBLISHER:"[Canadian Agency for Drugs and Technologies in Health][Ottawa (ON)]'
  //   const content = 'Codeine for Acute Pain for Urological or General Surgery Patients: A Review of Clinical Effectiveness'
  //   const received = highlightByQuery(query, content, options)
  //   const expected = ''
  //   expect(received).toThrowError(/SyntaxError/)
  // })

  test('brain barrier', () => {
    const query = 'brain barrier'
    const content =
      'Genetic disruption of the Blood Brain Barrier leads to protective barrier formation at the Glia Limitans'
    const received = highlightByQuery(query, content, options)
    const expected =
      'Genetic disruption of the Blood <span id="highlight-0" class="highlight">Brain</span> <span id="highlight-1" class="highlight">Barrier</span> leads to protective <span id="highlight-2" class="highlight">barrier</span> formation at the Glia Limitans'
    expect(received).toBe(expected)
  })

  test('Roles of H3K36-specific histone methyltransferases in transcription: b', () => {
    const query =
      'Roles of H3K36-specific histone methyltransferases in transcription: b'
    const content =
      'Histone Methyltransferases as Therapeutic Targets for Kidney Diseases.'
    const received = highlightByQuery(query, content, options)
    const expected =
      '<span id="highlight-0" class="highlight">Histone</span> <span id="highlight-1" class="highlight">Methyltransferases</span> as Therapeutic Targets for Kidney Diseases.'
    expect(received).toBe(expected)
  })

  test('HIV/AIDS', () => {
    const query = 'HIV/AIDS'
    const content =
      'Continuous renal replacement therapy in patients with HIV/AIDS.'
    const received = highlightByQuery(query, content, options)
    const expected =
      'Continuous renal replacement therapy in patients with <span id="highlight-0" class="highlight">HIV/AIDS</span>.'
    expect(received).toBe(expected)
  })

  test('Blood pressure-related', () => {
    const query = 'Blood pressure-related'
    const content =
      'Blood pressure-related electrocardiographic findings in healthy young individuals.'
    const received = highlightByQuery(query, content, options)
    const expected =
      '<span id="highlight-0" class="highlight">Blood</span> <span id="highlight-1" class="highlight">pressure-related</span> electrocardiographic findings in healthy young individuals.'
    expect(received).toBe(expected)
  })

  test('complex blood AND (HAS_FT:Y)', () => {
    const query = 'complex blood AND (HAS_FT:Y)'
    const content =
      'Use of magnoflorine-phospholipid complex to permeate blood-brain barrier and treat depression in the CUMS animal model.'
    const received = highlightByQuery(query, content, options)
    const expected =
      'Use of magnoflorine-phospholipid <span id="highlight-0" class="highlight">complex</span> to permeate <span id="highlight-1" class="highlight">blood</span>-brain barrier and treat depression in the CUMS animal model.'
    expect(received).toBe(expected)
  })

  test('cancer?', () => {
    const query = 'cancer?'
    const content =
      'A network Based method to predict cancer causal genes in GR Network.'
    const received = highlightByQuery(query, content, options)
    const expected =
      'A network Based method to predict <span id="highlight-0" class="highlight">cancer</span> causal genes in GR Network.'
    expect(received).toBe(expected)
  })

  test('cancer of neck', () => {
    const query = 'cancer of neck'
    const content =
      'Management delays in patients with squamous cell cancer of neck node(s) and unknown primary site: a retrospective cohort study.'
    const received = highlightByQuery(query, content, options)
    const expected =
      'Management delays in patients with squamous cell <span id="highlight-0" class="highlight">cancer</span> of <span id="highlight-1" class="highlight">neck</span> node(s) and unknown primary site: a retrospective cohort study.'
    expect(received).toBe(expected)
  })

  test('INTRO:Aprotein interactions', () => {
    const query = 'INTRO:Aprotein interactions'
    const content =
      'GR Utilizes a Co-Chaperone Cytoplasmic CAR Retention Protein to Form an N/C Interaction.'
    const received = highlightByQuery(query, content, options)
    const expected =
      'GR Utilizes a Co-Chaperone Cytoplasmic CAR Retention Protein to Form an N/C Interaction.'
    expect(received).toBe(expected)
  })

  test('TITLE:"bl2', () => {
    const query = 'TITLE:"bl2'
    const content =
      'Antiobesity Effect of Garlic Extract Fermented by Lactobacillus plantarum BL2 in Diet-Induced Obese Mice.'
    const received = highlightByQuery(query, content, options)
    const expected =
      'Antiobesity Effect of Garlic Extract Fermented by Lactobacillus plantarum <span id="highlight-0" class="highlight">BL2</span> in Diet-Induced Obese Mice.'
    expect(received).toBe(expected)
  })

  test('"blood" "cancer"', () => {
    const query = '"blood" "cancer"'
    const content =
      'Appraisal of Metal Imbalances in the Blood of Thyroid Cancer Patients in Comparison with Healthy Subjects.'
    const received = highlightByQuery(query, content, options)
    const expected =
      'Appraisal of Metal Imbalances in the <span id="highlight-0" class="highlight">Blood</span> of Thyroid <span id="highlight-1" class="highlight">Cancer</span> Patients in Comparison with Healthy Subjects.'
    expect(received).toBe(expected)
  })

  test('blood on the had', () => {
    const query = 'blood on the had'
    const content =
      'No viremia of pandemic (H1N1) 2009 was demonstrated in blood donors who had donated blood during the probable incubation period.'
    const received = highlightByQuery(query, content, options)
    const expected =
      'No viremia of pandemic (H1N1) 2009 was demonstrated in <span id="highlight-0" class="highlight">blood</span> donors who <span id="highlight-2" class="highlight">had</span> donated <span id="highlight-1" class="highlight">blood</span> during the probable incubation period.'
    expect(received).toBe(expected)
  })

  test('(cancer NOT blood)', () => {
    const query = '(cancer NOT blood)'
    const content =
      "Supramolecular self-assembly of a hybrid 'hyalurosome' for targeted photothermal therapy in non-small cell lung cancer."
    const received = highlightByQuery(query, content, options)
    const expected =
      'Supramolecular self-assembly of a hybrid \'hyalurosome\' for targeted photothermal therapy in non-small cell lung <span id="highlight-0" class="highlight">cancer</span>.'
    expect(received).toBe(expected)
  })

  test('(cancer OR blood)', () => {
    const query = '(cancer OR blood)'
    const content =
      "Parents' perspectives on dried blood spot self-sampling from children with epilepsy: A mixed method study."
    const received = highlightByQuery(query, content, options)
    const expected =
      'Parents\' perspectives on dried <span id="highlight-0" class="highlight">blood</span> spot self-sampling from children with epilepsy: A mixed method study.'
    expect(received).toBe(expected)
  })

  test('TITLE:"blood in"', () => {
    const query = 'TITLE:"blood in"'
    const content =
      'Strawberry milk-like blood in a subject with diabetic lipemia: dramatic change to transparent color after insulin therapy.'
    const received = highlightByQuery(query, content, options)
    const expected =
      'Strawberry milk-like <span id="highlight-0" class="highlight">blood in</span> a subject with diabetic lipemia: dramatic change to transparent color after insulin therapy.'
    expect(received).toBe(expected)
  })
})

describe('other tests for function highlightByQuery', () => {
  test('TITLE:blood AND CONTENT:cell', () => {
    const query = 'TITLE:blood AND CONTENT:cell'
    const content =
      'A molecular map of lymph node blood vascular endothelium at single cell resolution'
    const received = highlightByQuery(query, content, {
      validFields: ['TITLE']
    })
    const expected =
      'A molecular map of lymph node <span id="highlight-0" class="highlight">blood</span> vascular endothelium at single cell resolution'
    expect(received).toBe(expected)
  })

  test('TITLE:blood OR CONTENT:cell', () => {
    const query = 'TITLE:blood OR CONTENT:cell'
    const content =
      'A molecular map of lymph node blood vascular endothelium at single cell resolution'
    const received = highlightByQuery(query, content, {
      validFields: ['TITLE', 'CONTENT'],
      highlightedFields: ['CONTENT']
    })
    const expected =
      'A molecular map of lymph node blood vascular endothelium at single <span id="highlight-0" class="highlight">cell</span> resolution'
    expect(received).toBe(expected)
  })

  test('TITLE:blood OR cell', () => {
    const query = 'TITLE:blood OR cell'
    const content =
      'A molecular map of lymph node blood vascular endothelium at single cell resolution'
    const received = highlightByQuery(query, content, {
      validFields: ['TITLE']
    })
    const expected =
      'A molecular map of lymph node <span id="highlight-0" class="highlight">blood</span> vascular endothelium at single <span id="highlight-1" class="highlight">cell</span> resolution'
    expect(received).toBe(expected)
  })

  test('blood', () => {
    const query = 'blood'
    const content =
      "Pediatric non-red cell blood product transfusion practices: what's the evidence to guide transfusion of the 'yellow' blood products?"
    const received = highlightByQuery(query, content, {
      highlightAll: false
    })
    const expected =
      'Pediatric non-red cell <span id="highlight-0" class="highlight">blood</span> product transfusion practices: what\'s the evidence to guide transfusion of the \'yellow\' blood products?'
    expect(received).toBe(expected)
  })
})

describe('tests for function isStopWord', () => {
  test('return true', () => {
    const received = isStopWord('of')
    expect(received).toBeTruthy()
  })
  test('return false', () => {
    const received = isStopWord('I')
    expect(received).toBeFalsy()
  })
})
