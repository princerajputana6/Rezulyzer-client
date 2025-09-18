import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  Briefcase, 
  GraduationCap,
  Award,
  Download,
  Edit,
  Trash2,
  ExternalLink,
  User,
  Building,
  Clock
} from 'lucide-react';
import { useDispatch } from 'react-redux';
import { showToast } from '../../redux/slices/toastSlice';
import { apiClient } from '../../services/apiClient';

const CandidateProfilePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [candidate, setCandidate] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCandidate = async () => {
      try {
        setLoading(true);
        const response = await apiClient.get(`/candidates/${id}`);
        if (response.data.success) {
          setCandidate(response.data.data);
        }
      } catch (error) {
        console.error('Error fetching candidate:', error);
        dispatch(showToast({
          message: 'Failed to load candidate details',
          type: 'error'
        }));
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchCandidate();
    }
  }, [id, dispatch]);

  const handleDownloadResume = async () => {
    try {
      const response = await apiClient.get(`/candidates/${id}/resume`);
      if (response.data.success && response.data.downloadUrl) {
        window.open(response.data.downloadUrl, '_blank');
      } else {
        dispatch(showToast({ message: 'Could not get download link.', type: 'error' }));
      }
    } catch (error) {
      console.error('Error downloading resume:', error);
      dispatch(showToast({ message: 'Failed to download resume.', type: 'error' }));
    }
  };

  const handleEditCandidate = () => {
    navigate(`/candidates/${id}/edit`);
  };

  const handleDeleteCandidate = async () => {
    if (window.confirm('Are you sure you want to delete this candidate?')) {
      try {
        await apiClient.delete(`/candidates/${id}`);
        dispatch(showToast({
          message: 'Candidate deleted successfully',
          type: 'success'
        }));
        navigate('/candidates');
      } catch (error) {
        console.error('Error deleting candidate:', error);
        dispatch(showToast({
          message: 'Failed to delete candidate',
          type: 'error'
        }));
      }
    }
  };

  const getSkillLevelColor = (level) => {
    switch (level.toLowerCase()) {
      case 'expert': return 'bg-green-100 text-green-800';
      case 'advanced': return 'bg-blue-100 text-blue-800';
      case 'intermediate': return 'bg-yellow-100 text-yellow-800';
      case 'beginner': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatDateRange = (startDate, endDate) => {
    const start = new Date(startDate).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short'
    });
    const end = endDate ? new Date(endDate).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short'
    }) : 'Present';
    return `${start} - ${end}`;
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="space-y-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!candidate) {
    return (
      <div className="p-6 text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Candidate Not Found</h2>
        <button
          onClick={() => navigate('/candidates')}
          className="text-blue-600 hover:text-blue-800"
        >
          Back to Candidates
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <button
            onClick={() => navigate('/candidates')}
            className="mr-4 p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Candidate Profile</h1>
            <p className="text-gray-600 mt-1">Detailed information extracted from resume</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <button
            onClick={handleDownloadResume}
            className="inline-flex items-center px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Download className="w-4 h-4 mr-2" />
            Download Resume
          </button>
          <button
            onClick={handleEditCandidate}
            className="inline-flex items-center px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Edit className="w-4 h-4 mr-2" />
            Edit
          </button>
          <button
            onClick={handleDeleteCandidate}
            className="inline-flex items-center px-4 py-2 text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Delete
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Basic Info */}
        <div className="lg:col-span-1 space-y-6">
          {/* Profile Card */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="text-center mb-6">
              <div className="w-24 h-24 bg-blue-500 rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4">
                {candidate.name?.split(' ').map(n => n[0]).join('') || 'N/A'}
              </div>
              <h2 className="text-xl font-bold text-gray-900">{candidate.name || 'N/A'}</h2>
              <p className="text-gray-600">{candidate.currentPosition?.title || 'N/A'}</p>
              <p className="text-sm text-gray-500">{candidate.currentPosition?.company || 'N/A'}</p>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center text-gray-600">
                <Mail className="w-4 h-4 mr-3" />
                <span className="text-sm">{candidate.email || 'N/A'}</span>
              </div>
              <div className="flex items-center text-gray-600">
                <Phone className="w-4 h-4 mr-3" />
                <span className="text-sm">{candidate.phone || 'N/A'}</span>
              </div>
              <div className="flex items-center text-gray-600">
                <MapPin className="w-4 h-4 mr-3" />
                <span className="text-sm">{candidate.location || 'N/A'}</span>
              </div>
              {candidate.dateOfBirth && (
                <div className="flex items-center text-gray-600">
                  <Calendar className="w-4 h-4 mr-3" />
                  <span className="text-sm">Born {formatDate(candidate.dateOfBirth)}</span>
                </div>
              )}
            </div>
            
            {(candidate.linkedinUrl || candidate.portfolioUrl) && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h3 className="text-sm font-medium text-gray-900 mb-3">Links</h3>
                <div className="space-y-2">
                  {candidate.linkedinUrl && (
                    <a
                      href={candidate.linkedinUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center text-blue-600 hover:text-blue-800 text-sm"
                    >
                      <ExternalLink className="w-3 h-3 mr-2" />
                      LinkedIn Profile
                    </a>
                  )}
                  {candidate.portfolioUrl && (
                    <a
                      href={candidate.portfolioUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center text-blue-600 hover:text-blue-800 text-sm"
                    >
                      <ExternalLink className="w-3 h-3 mr-2" />
                      Portfolio
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Resume Info */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Resume Information</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">File Name:</span>
                <span className="text-gray-900">{candidate.resumeInfo.fileName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Upload Date:</span>
                <span className="text-gray-900">{formatDate(candidate.resumeInfo.uploadDate)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">File Size:</span>
                <span className="text-gray-900">{candidate.resumeInfo.fileSize}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Extracted:</span>
                <span className="text-gray-900">{formatDate(candidate.resumeInfo.extractedDate)}</span>
              </div>
            </div>
          </div>

          {/* Application Status */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Application Status</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Status:</span>
                <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                  {candidate.status.charAt(0).toUpperCase() + candidate.status.slice(1)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Applied:</span>
                <span className="text-gray-900">{formatDate(candidate.applicationInfo.appliedDate)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Last Activity:</span>
                <span className="text-gray-900">{formatDate(candidate.applicationInfo.lastActivity)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Source:</span>
                <span className="text-gray-900">Resume Upload</span>
              </div>
            </div>
            {candidate.applicationInfo.notes && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <p className="text-sm text-gray-600">{candidate.applicationInfo.notes}</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column - Detailed Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Professional Summary */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Professional Summary</h3>
            <p className="text-gray-700 leading-relaxed">{candidate.summary}</p>
          </div>

          {/* Work Experience */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-6">Work Experience</h3>
            <div className="space-y-6">
              {candidate.experience.map((exp, index) => (
                <div key={index} className="relative pl-6 border-l-2 border-gray-200 last:border-l-0">
                  <div className="absolute -left-2 top-0 w-4 h-4 bg-blue-500 rounded-full"></div>
                  <div className="mb-2">
                    <h4 className="text-lg font-medium text-gray-900">{exp.title}</h4>
                    <div className="flex items-center text-gray-600 mb-1">
                      <Building className="w-4 h-4 mr-2" />
                      <span>{exp.company}</span>
                      {exp.current && (
                        <span className="ml-2 px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                          Current
                        </span>
                      )}
                    </div>
                    <div className="flex items-center text-gray-500 text-sm mb-3">
                      <MapPin className="w-3 h-3 mr-1" />
                      <span className="mr-4">{exp.location}</span>
                      <Clock className="w-3 h-3 mr-1" />
                      <span>{formatDateRange(exp.startDate, exp.endDate)}</span>
                    </div>
                  </div>
                  <p className="text-gray-700 mb-3">{exp.description}</p>
                  {exp.achievements && exp.achievements.length > 0 && (
                    <div>
                      <h5 className="text-sm font-medium text-gray-900 mb-2">Key Achievements:</h5>
                      <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                        {exp.achievements.map((achievement, index) => (
                          <li key={index}>{achievement}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Education */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-6">Education</h3>
            <div className="space-y-4">
              {candidate.education.map((edu, index) => (
                <div key={index} className="border-l-2 border-gray-200 pl-6 relative">
                  <div className="absolute -left-2 top-0 w-4 h-4 bg-purple-500 rounded-full"></div>
                  <h4 className="text-lg font-medium text-gray-900">{edu.degree}</h4>
                  <div className="flex items-center text-gray-600 mb-1">
                    <GraduationCap className="w-4 h-4 mr-2" />
                    <span>{edu.institution}</span>
                  </div>
                  <div className="flex items-center text-gray-500 text-sm mb-2">
                    <MapPin className="w-3 h-3 mr-1" />
                    <span className="mr-4">{edu.location}</span>
                    <Clock className="w-3 h-3 mr-1" />
                    <span>{formatDateRange(edu.startDate, edu.endDate)}</span>
                  </div>
                  {edu.gpa && (
                    <p className="text-sm text-gray-700 mb-2">GPA: {edu.gpa}</p>
                  )}
                  {edu.achievements && edu.achievements.length > 0 && (
                    <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                      {edu.achievements.map((achievement, index) => (
                        <li key={index}>{achievement}</li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Skills */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-6">Skills</h3>
            
            {/* Technical Skills */}
            <div className="mb-6">
              <h4 className="text-md font-medium text-gray-900 mb-3">Technical Skills</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {candidate.skills.technical.map((skill, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <span className="font-medium text-gray-900">{skill.name}</span>
                      <span className="text-sm text-gray-600 ml-2">({skill.years} years)</span>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSkillLevelColor(skill.level)}`}>
                      {skill.level}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Soft Skills */}
            <div>
              <h4 className="text-md font-medium text-gray-900 mb-3">Soft Skills</h4>
              <div className="flex flex-wrap gap-2">
                {candidate.skills.soft.map((skill, index) => (
                  <span key={index} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Certifications */}
          {candidate.certifications && candidate.certifications.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-6">Certifications</h3>
              <div className="space-y-4">
                {candidate.certifications.map((cert, index) => (
                  <div key={index} className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg">
                    <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                      <Award className="w-5 h-5 text-yellow-600" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{cert.name}</h4>
                      <p className="text-sm text-gray-600">{cert.issuer}</p>
                      <div className="flex items-center text-xs text-gray-500 mt-1">
                        <span>Issued: {formatDate(cert.issueDate)}</span>
                        {cert.expiryDate && (
                          <span className="ml-4">Expires: {formatDate(cert.expiryDate)}</span>
                        )}
                      </div>
                      {cert.credentialId && (
                        <p className="text-xs text-gray-500 mt-1">ID: {cert.credentialId}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Projects */}
          {candidate.projects && candidate.projects.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-6">Notable Projects</h3>
              <div className="space-y-6">
                {candidate.projects.map((project, index) => (
                  <div key={index} className="border-l-2 border-gray-200 pl-6 relative">
                    <div className="absolute -left-2 top-0 w-4 h-4 bg-green-500 rounded-full"></div>
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="text-lg font-medium text-gray-900">{project.name}</h4>
                      {project.url && (
                        <a
                          href={project.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      )}
                    </div>
                    <p className="text-gray-700 mb-3">{project.description}</p>
                    <div className="flex items-center text-gray-500 text-sm mb-3">
                      <Clock className="w-3 h-3 mr-1" />
                      <span>{formatDateRange(project.startDate, project.endDate)}</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {project.technologies.map((tech, index) => (
                        <span key={index} className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-sm">
                          {tech}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CandidateProfilePage;
