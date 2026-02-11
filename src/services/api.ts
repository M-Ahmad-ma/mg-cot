import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = 'https://pakizabites.com/api';
const TOKEN_KEY = 'auth_token';
const SCHOOL_ID_KEY = 'school_id';
const VISIT_ID_KEY = 'visit_id';
const OBSERVATION_STATE_KEY = 'observation_state';

const log = {
  info: (tag: string, message: string, data?: any) => {
    console.log(
      `[API][${tag}] ${message}`,
      data ? JSON.stringify(data, null, 2) : '',
    );
  },
  error: (tag: string, message: string, error?: any) => {
    console.error(`[API][${tag}] ${message}`, error || '');
  },
  warn: (tag: string, message: string, data?: any) => {
    console.warn(`[API][${tag}] ${message}`, data || '');
  },
};

export const saveVisitId = async (visitId: string | number) => {
  try {
    await AsyncStorage.setItem(VISIT_ID_KEY, visitId.toString());
    log.info('VisitId', `Saved visit ID: ${visitId}`);
  } catch (e) {
    log.error('VisitId', 'Failed to save visit ID', e);
  }
};

export const getVisitId = async (): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem(VISIT_ID_KEY);
  } catch (e) {
    log.error('VisitId', 'Failed to get visit ID', e);
    return null;
  }
};

export const clearVisitId = async () => {
  try {
    await AsyncStorage.removeItem(VISIT_ID_KEY);
    log.info('VisitId', 'Cleared visit ID');
  } catch (e) {
    log.error('VisitId', 'Failed to clear visit ID', e);
  }
};

export interface ObservationState {
  isMultiGrade: boolean | null;
  selectedGrade: string | null;
  selectedGrades: string[];
  gradeData: { [key: string]: GradeData };
}

export const saveObservationState = async (state: ObservationState) => {
  try {
    await AsyncStorage.setItem(OBSERVATION_STATE_KEY, JSON.stringify(state));
    log.info('ObservationState', 'Saved observation state');
  } catch (e) {
    log.error('ObservationState', 'Failed to save observation state', e);
  }
};

export const getObservationState =
  async (): Promise<ObservationState | null> => {
    try {
      const state = await AsyncStorage.getItem(OBSERVATION_STATE_KEY);
      if (state) {
        log.info('ObservationState', 'Retrieved observation state');
        return JSON.parse(state);
      }
      return null;
    } catch (e) {
      log.error('ObservationState', 'Failed to get observation state', e);
      return null;
    }
  };

export const clearObservationState = async () => {
  try {
    await AsyncStorage.removeItem(OBSERVATION_STATE_KEY);
    log.info('ObservationState', 'Cleared observation state');
  } catch (e) {
    log.error('ObservationState', 'Failed to clear observation state', e);
  }
};

export const saveSchoolId = async (schoolId: string | number) => {
  try {
    await AsyncStorage.setItem(SCHOOL_ID_KEY, schoolId.toString());
    log.info('SchoolId', `Saved school ID: ${schoolId}`);
  } catch (e) {
    log.error('SchoolId', 'Failed to save school ID', e);
  }
};

export const getSchoolId = async (): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem(SCHOOL_ID_KEY);
  } catch (e) {
    log.error('SchoolId', 'Failed to get school ID', e);
    return null;
  }
};

export const clearSchoolId = async () => {
  try {
    await AsyncStorage.removeItem(SCHOOL_ID_KEY);
    log.info('SchoolId', 'Cleared school ID');
  } catch (e) {
    log.error('SchoolId', 'Failed to clear school ID', e);
  }
};

export const saveToken = async (token: string) => {
  try {
    await AsyncStorage.setItem(TOKEN_KEY, token);
    log.info('Auth', 'Token saved');
  } catch (e) {
    log.error('Auth', 'Failed to save token', e);
  }
};

export const getToken = async (): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem(TOKEN_KEY);
  } catch (e) {
    log.error('Auth', 'Failed to get token', e);
    return null;
  }
};

export const clearToken = async () => {
  try {
    await AsyncStorage.removeItem(TOKEN_KEY);
    log.info('Auth', 'Token cleared');
  } catch (e) {
    log.error('Auth', 'Failed to clear token', e);
  }
};

export const verifySchool = async (schoolCode: string) => {
  const token = await getToken();
  log.info('School', `Verifying school: ${schoolCode}`);

  const response = await fetch(`${API_BASE_URL}/school/${schoolCode}`, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      Authorization: token ? `Bearer ${token}` : '',
    },
  });

  const data = await response.json();
  log.info('School', `Verify response status: ${response.status}`);

  if (!response.ok) {
    throw new Error(data.message || 'School verification failed');
  }

  const schoolId = data.data?.id || data.school_id || data.school?.id;

  if (schoolId) {
    await saveSchoolId(schoolId);
    log.info('School', `School ID saved: ${schoolId}`);
  } else {
    log.warn('School', 'No school ID found in response');
  }

  return data;
};

export const startVisit = async (schoolId: number) => {
  try {
    const token = await getToken();

    if (!token) {
      throw new Error('No authentication token found. Please login first.');
    }

    log.info('Visit', `Starting visit for school: ${schoolId}`);

    const response = await fetch(
      `${API_BASE_URL}/schools/${schoolId}/start-visit`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          Authorization: `Bearer ${token}`,
          'User-Agent': 'MGCOT-App/1.0',
        },
      },
    );

    const responseText = await response.text();
    let parsedResponse;
    try {
      parsedResponse = JSON.parse(responseText);
    } catch {
      parsedResponse = responseText;
    }

    if (!response.ok) {
      let errorMessage = `Failed to start visit (Status: ${response.status})`;

      if (typeof parsedResponse === 'object' && parsedResponse !== null) {
        errorMessage =
          parsedResponse.message || parsedResponse.error || errorMessage;
      } else if (typeof parsedResponse === 'string') {
        errorMessage = parsedResponse;
      }

      log.error('Visit', `Failed to start visit: ${errorMessage}`);
      return {
        success: false,
        message: errorMessage,
        data: parsedResponse,
        status: response.status,
      };
    }

    let visitId = null;

    if (typeof parsedResponse === 'object' && parsedResponse !== null) {
      visitId =
        parsedResponse.data?.visit?.id ||
        parsedResponse.visit?.id ||
        parsedResponse.id ||
        parsedResponse.data?.id;

      if (visitId) {
        await saveVisitId(visitId);
        log.info('Visit', `Visit started successfully. Visit ID: ${visitId}`);
      } else {
        log.warn('Visit', 'No visit ID found in response');
      }
    }

    return {
      success: true,
      message:
        (typeof parsedResponse === 'object' && parsedResponse.message) ||
        'Visit started successfully',
      data: parsedResponse,
      visitId: visitId,
      status: response.status,
    };
  } catch (error: any) {
    log.error('Visit', 'Error starting visit', error);

    let message = 'Failed to start visit. Please try again.';

    if (error.message.includes('No authentication token')) {
      message = error.message;
    } else if (error.name === 'AbortError') {
      message = 'Request timeout. Please check your connection.';
    } else if (error.message?.includes('Network request failed')) {
      message = 'Network connection failed. Please check internet.';
    }

    return {
      success: false,
      message,
      error: error.message,
    };
  }
};

export const startVisitWithSavedSchool = async () => {
  try {
    const schoolId = await getSchoolId();

    if (!schoolId) {
      throw new Error('No school ID found. Please verify a school first.');
    }

    log.info('Visit', `Starting visit with saved school: ${schoolId}`);
    const result = await startVisit(parseInt(schoolId, 10));
    log.info(
      'Visit',
      `Start visit result: ${result.success ? 'Success' : 'Failed'}`,
    );

    return result;
  } catch (error: any) {
    log.error('Visit', 'Error in startVisitWithSavedSchool', error);
    return {
      success: false,
      message: error.message || 'Failed to start visit',
    };
  }
};

export const login = async (cnic: string, password: string) => {
  try {
    log.info('Auth', `Login attempt for CNIC: ${cnic}`);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    const response = await fetch(`${API_BASE_URL}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'User-Agent': 'MGCOT-App/1.0',
      },
      body: JSON.stringify({ cnic, password }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const responseText = await response.text();
    let data: any;
    try {
      data = JSON.parse(responseText);
    } catch {
      log.error('Auth', 'Invalid JSON response', responseText);
      return {
        success: false,
        message: 'Invalid server response',
        raw: responseText,
      };
    }

    if (!response.ok) {
      log.error('Auth', `Login failed: ${data.message || data.error}`);
      return {
        success: false,
        message:
          data.message || data.error || `Login failed (${response.status})`,
        data,
      };
    }

    const token =
      data.token ||
      data.access_token ||
      data?.data?.token ||
      data?.data?.access_token;

    if (!token) {
      log.warn('Auth', 'Login succeeded but no token found');
      return {
        success: false,
        message: 'Authentication token missing from response',
        data,
      };
    }

    await saveToken(token);
    log.info('Auth', 'Login successful');

    return {
      success: true,
      token,
      data,
    };
  } catch (error: any) {
    log.error('Auth', 'Login error', error);

    let message = 'Network error. Please try again.';

    if (error.name === 'AbortError') {
      message = 'Request timeout. Please check your connection.';
    } else if (error.message?.includes('Network request failed')) {
      message = 'Network connection failed. Please check internet.';
    } else if (error.message?.includes('Failed to fetch')) {
      message = 'Unable to reach server.';
    }

    return {
      success: false,
      message,
      error: error.message,
    };
  }
};

export const getDomainsWithQuestions = async () => {
  try {
    const token = await getToken();
    log.info('Domains', 'Fetching domains with questions');

    const response = await fetch(`${API_BASE_URL}/domains-with-questions`, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        Authorization: token ? `Bearer ${token}` : '',
        'User-Agent': 'MGCOT-App/1.0',
      },
    });

    const data = await response.json();

    console.log('questions:', data);

    if (!response.ok) {
      log.error('Domains', 'Failed to fetch domains', data.message);
      throw new Error(data.message || 'Failed to fetch domains');
    }

    log.info('Domains', `Fetched ${data.data?.length || 0} domains`);
    return data;
  } catch (error: any) {
    log.error('Domains', 'Error fetching domains', error);
    return null;
  }
};

export const getDomainWithQuestions = async (domainId: number) => {
  try {
    const token = await getToken();
    log.info('Domains', `Fetching domain ${domainId} with questions`);

    const response = await fetch(
      `${API_BASE_URL}/domains/${domainId}/with-questions`,
      {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          Authorization: token ? `Bearer ${token}` : '',
          'User-Agent': 'MGCOT-App/1.0',
        },
      },
    );

    const data = await response.json();

    console.log(data);

    if (!response.ok) {
      log.error('Domains', `Failed to fetch domain ${domainId}`, data.message);
      throw new Error(
        data.message || `Failed to fetch domain ${domainId} with questions`,
      );
    }

    log.info('Domains', `Domain ${domainId} fetched successfully`);
    return data;
  } catch (error: any) {
    log.error('Domains', `Error fetching domain ${domainId}`, error);
    return null;
  }
};

export const testConnection = async () => {
  try {
    log.info('Connection', `Testing connection to ${API_BASE_URL}`);

    const response = await fetch(API_BASE_URL, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        'User-Agent': 'MGCOT-App/1.0',
      },
    });

    log.info('Connection', `Test successful. Status: ${response.status}`);
    return { success: true, status: response.status };
  } catch (error: any) {
    log.error('Connection', 'Test failed', error);
    return { success: false, error: error.message || 'Unknown error' };
  }
};

export interface GradeData {
  grade_name: string;
  subject: string;
  total_students: number;
  present_boys: number;
  present_girls: number;
}

export interface PreviousRating {
  question_id: number;
  previous_rating?: number;
  previous_comments?: string;
  average_rating?: number;
}

export interface PreviousRatingsResponse {
  success: boolean;
  data?: PreviousRating[];
  message?: string;
}

export interface RatingItem {
  question_id: number;
  rating: number;
  comments?: string;
}

export interface SubmitRatingsRequest {
  grade_names: string[];
  context_type: 'single' | 'combined';
  ratings: RatingItem[];
}

export interface SubmitRatingsResponse {
  success: boolean;
  message?: string;
  data?: any;
  error?: string;
}

export const addGrades = async (
  visitId: number,
  grades: GradeData[],
): Promise<{
  success: boolean;
  message?: string;
  data?: any;
  error?: string;
}> => {
  try {
    const token = await getToken();

    if (!token) {
      throw new Error('No authentication token found. Please login first.');
    }

    log.info('Grades', `Adding ${grades.length} grades for visit ${visitId}`);

    const response = await fetch(
      `${API_BASE_URL}/visits/${visitId}/add-grades`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          Authorization: `Bearer ${token}`,
          'User-Agent': 'MGCOT-App/1.0',
        },
        body: JSON.stringify({ grades }),
      },
    );

    const responseText = await response.text();
    let parsedResponse;
    try {
      parsedResponse = JSON.parse(responseText);
    } catch {
      parsedResponse = responseText;
    }

    if (!response.ok) {
      let errorMessage = `Failed to add grades (Status: ${response.status})`;

      if (typeof parsedResponse === 'object' && parsedResponse !== null) {
        errorMessage =
          parsedResponse.message || parsedResponse.error || errorMessage;
      } else if (typeof parsedResponse === 'string') {
        errorMessage = parsedResponse;
      }

      log.error('Grades', errorMessage);
      return {
        success: false,
        message: errorMessage,
        data: parsedResponse,
      };
    }

    log.info('Grades', 'Grades added successfully');
    return {
      success: true,
      message:
        typeof parsedResponse === 'object' && parsedResponse.message
          ? parsedResponse.message
          : 'Grades added successfully',
      data: parsedResponse,
    };
  } catch (error: any) {
    log.error('Grades', 'Error adding grades', error);

    let message = 'Failed to add grades. Please try again.';

    if (error.message.includes('No authentication token')) {
      message = error.message;
    } else if (error.name === 'AbortError') {
      message = 'Request timeout. Please check your connection.';
    } else if (error.message?.includes('Network request failed')) {
      message = 'Network connection failed. Please check internet.';
    }

    return {
      success: false,
      message,
      error: error.message,
    };
  }
};

export const getPreviousRatings = async (
  visitId: number,
  gradeNames: string[],
  contextType: 'single' | 'combined',
): Promise<PreviousRatingsResponse> => {
  try {
    const token = await getToken();

    if (!token) {
      throw new Error('No authentication token found. Please login first.');
    }

    log.info('Ratings', `Fetching previous ratings for visit ${visitId}`);
    log.info(
      'Ratings',
      `Context: ${contextType}, Grades: ${gradeNames.join(', ')}`,
    );

    const response = await fetch(
      `${API_BASE_URL}/visits/${visitId}/previous-ratings`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          Authorization: `Bearer ${token}`,
          'User-Agent': 'MGCOT-App/1.0',
        },
        body: JSON.stringify({
          grade_names: gradeNames,
          context_type: contextType,
        }),
      },
    );

    const responseText = await response.text();

    console.log(responseText);

    let parsedResponse;
    try {
      parsedResponse = JSON.parse(responseText);
    } catch {
      parsedResponse = responseText;
    }

    if (!response.ok) {
      let errorMessage = `Failed to fetch previous ratings (Status: ${response.status})`;

      if (typeof parsedResponse === 'object' && parsedResponse !== null) {
        errorMessage =
          parsedResponse.message || parsedResponse.error || errorMessage;
      } else if (typeof parsedResponse === 'string') {
        errorMessage = parsedResponse;
      }

      log.error('Ratings', errorMessage);
      return {
        success: false,
        message: errorMessage,
      };
    }

    const ratings =
      typeof parsedResponse === 'object' && parsedResponse !== null
        ? parsedResponse.data?.previous_ratings ||
          parsedResponse.previous_ratings ||
          []
        : [];

    log.info('Ratings', `Fetched ${ratings.length} previous ratings`);
    return {
      success: true,
      data: ratings,
    };
  } catch (error: any) {
    log.error('Ratings', 'Error fetching previous ratings', error);

    let message = 'Failed to fetch previous ratings. Please try again.';

    if (error.message.includes('No authentication token')) {
      message = error.message;
    } else if (error.name === 'AbortError') {
      message = 'Request timeout. Please check your connection.';
    } else if (error.message?.includes('Network request failed')) {
      message = 'Network connection failed. Please check internet.';
    }

    return {
      success: false,
      message,
    };
  }
};

export const submitRatings = async (
  visitId: number,
  request: SubmitRatingsRequest,
): Promise<SubmitRatingsResponse> => {
  try {
    const token = await getToken();

    if (!token) {
      throw new Error('No authentication token found. Please login first.');
    }

    log.info('Ratings', `Submitting ratings for visit ${visitId}`);
    log.info(
      'Ratings',
      `Context: ${request.context_type}, Grades: ${request.grade_names.join(
        ', ',
      )}`,
    );
    log.info('Ratings', `Submitting ${request.ratings.length} ratings`);

    const response = await fetch(
      `${API_BASE_URL}/visits/${visitId}/submit-ratings`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          Authorization: `Bearer ${token}`,
          'User-Agent': 'MGCOT-App/1.0',
        },
        body: JSON.stringify(request),
      },
    );

    const responseText = await response.text();
    let parsedResponse;
    try {
      parsedResponse = JSON.parse(responseText);
    } catch {
      parsedResponse = responseText;
    }

    if (!response.ok) {
      let errorMessage = `Failed to submit ratings (Status: ${response.status})`;

      if (typeof parsedResponse === 'object' && parsedResponse !== null) {
        errorMessage =
          parsedResponse.message || parsedResponse.error || errorMessage;
      } else if (typeof parsedResponse === 'string') {
        errorMessage = parsedResponse;
      }

      log.error('Ratings', errorMessage);
      return {
        success: false,
        message: errorMessage,
        data: parsedResponse,
      };
    }

    log.info('Ratings', 'Ratings submitted successfully');
    return {
      success: true,
      message:
        typeof parsedResponse === 'object' && parsedResponse.message
          ? parsedResponse.message
          : 'Ratings submitted successfully',
      data: parsedResponse,
    };
  } catch (error: any) {
    log.error('Ratings', 'Error submitting ratings', error);

    let message = 'Failed to submit ratings. Please try again.';

    if (error.message.includes('No authentication token')) {
      message = error.message;
    } else if (error.name === 'AbortError') {
      message = 'Request timeout. Please check your connection.';
    } else if (error.message?.includes('Network request failed')) {
      message = 'Network connection failed. Please check internet.';
    }

    return {
      success: false,
      message,
      error: error.message,
    };
  }
};

export interface TeacherDiscussionQuestion {
  id: number;
  question: string;
  order?: number;
}

export interface TeacherDiscussionResponse {
  success: boolean;
  data?: TeacherDiscussionQuestion[];
  message?: string;
}

export interface TeacherDiscussionApiResponse {
  success: boolean;
  data: {
    questions: TeacherDiscussionQuestion[];
    total_questions: number;
  };
  message?: string;
}

export interface SubmitTeacherDiscussionRequest {
  responses: {
    question_id: number;
    response: boolean;
  }[];
}

export interface SubmitTeacherDiscussionResponse {
  success: boolean;
  message?: string;
  data?: any;
  error?: string;
}

export const getTeacherDiscussionQuestions =
  async (): Promise<TeacherDiscussionResponse> => {
    try {
      const token = await getToken();

      if (!token) {
        throw new Error('No authentication token found. Please login first.');
      }

      log.info('TeacherDiscussion', 'Fetching teacher discussion questions');

      const response = await fetch(
        `${API_BASE_URL}/teacher-discussion/questions`,
        {
          method: 'GET',
          headers: {
            Accept: 'application/json',
            Authorization: `Bearer ${token}`,
            'User-Agent': 'MGCOT-App/1.0',
          },
        },
      );

      const responseText = await response.text();

      console.log('this is the teacher discussion questions', responseText);

      let parsedResponse;
      try {
        parsedResponse = JSON.parse(responseText);
      } catch {
        parsedResponse = responseText;
      }

      if (!response.ok) {
        let errorMessage = `Failed to fetch questions (Status: ${response.status})`;

        if (typeof parsedResponse === 'object' && parsedResponse !== null) {
          errorMessage =
            parsedResponse.message || parsedResponse.error || errorMessage;
        } else if (typeof parsedResponse === 'string') {
          errorMessage = parsedResponse;
        }

        log.error('TeacherDiscussion', errorMessage);
        return {
          success: false,
          message: errorMessage,
        };
      }

      const questions =
        typeof parsedResponse === 'object' && parsedResponse !== null
          ? parsedResponse.data?.questions || parsedResponse.questions || []
          : [];

      log.info('TeacherDiscussion', `Fetched ${questions.length} questions`);
      return {
        success: true,
        data: questions,
      };
    } catch (error: any) {
      log.error('TeacherDiscussion', 'Error fetching questions', error);

      let message = 'Failed to fetch questions. Please try again.';

      if (error.message.includes('No authentication token')) {
        message = error.message;
      } else if (error.name === 'AbortError') {
        message = 'Request timeout. Please check your connection.';
      } else if (error.message?.includes('Network request failed')) {
        message = 'Network connection failed. Please check internet.';
      }

      return {
        success: false,
        message,
      };
    }
  };

export const submitTeacherDiscussion = async (
  visitId: number,
  request: SubmitTeacherDiscussionRequest,
): Promise<SubmitTeacherDiscussionResponse> => {
  try {
    const token = await getToken();

    if (!token) {
      throw new Error('No authentication token found. Please login first.');
    }

    log.info(
      'TeacherDiscussion',
      `Submitting teacher discussion for visit ${visitId}`,
    );
    log.info(
      'TeacherDiscussion',
      `Submitting ${request.responses.length} responses`,
    );

    const response = await fetch(
      `${API_BASE_URL}/visits/${visitId}/teacher-discussion`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          Authorization: `Bearer ${token}`,
          'User-Agent': 'MGCOT-App/1.0',
        },
        body: JSON.stringify(request),
      },
    );

    const responseText = await response.text();

    console.log('discussion questions', response);

    let parsedResponse;
    try {
      parsedResponse = JSON.parse(responseText);
    } catch {
      parsedResponse = responseText;
    }

    if (!response.ok) {
      let errorMessage = `Failed to submit discussion (Status: ${response.status})`;

      if (typeof parsedResponse === 'object' && parsedResponse !== null) {
        errorMessage =
          parsedResponse.message || parsedResponse.error || errorMessage;
      } else if (typeof parsedResponse === 'string') {
        errorMessage = parsedResponse;
      }

      log.error('TeacherDiscussion', errorMessage);
      return {
        success: false,
        message: errorMessage,
        data: parsedResponse,
      };
    }

    log.info('TeacherDiscussion', 'Discussion submitted successfully');
    return {
      success: true,
      message:
        typeof parsedResponse === 'object' && parsedResponse.message
          ? parsedResponse.message
          : 'Discussion submitted successfully',
      data: parsedResponse,
    };
  } catch (error: any) {
    log.error('TeacherDiscussion', 'Error submitting discussion', error);

    let message = 'Failed to submit discussion. Please try again.';

    if (error.message.includes('No authentication token')) {
      message = error.message;
    } else if (error.name === 'AbortError') {
      message = 'Request timeout. Please check your connection.';
    } else if (error.message?.includes('Network request failed')) {
      message = 'Network connection failed. Please check internet.';
    }

    return {
      success: false,
      message,
      error: error.message,
    };
  }
};
