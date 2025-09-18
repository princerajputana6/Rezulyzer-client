import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { 
  Save, 
  Plus, 
  Trash2, 
  Brain, 
  Upload, 
  Eye,
  Settings,
  Clock,
  FileText
} from 'lucide-react';
import { showToast } from '../../redux/slices/uiSlice';
import testService from '../../services/testService';

const CreateTest = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const isEditing = Boolean(id);

  const [testData, setTestData] = useState({
    title: '',
    description: '',
    type: 'technical',
    duration: 60,
    passingScore: 70,
    instructions: '',
    settings: {
      shuffleQuestions: false,
      shuffleOptions: false,
      showResults: true,
      allowReview: true,
      preventCheating: false,
      timeLimit: true,
      autoSubmit: true,
    },
    questions: []
  });

  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [showAIGenerator, setShowAIGenerator] = useState(false);

  useEffect(() => {
    if (isEditing) {
      loadTest();
    }
  }, [id, isEditing]);

  const loadTest = async () => {
    try {
      setIsLoading(true);
      const response = await testService.getTestById(id);
      setTestData(response.data);
    } catch (error) {
      dispatch(showToast({
        message: 'Failed to load test',
        type: 'error'
      }));
      navigate('/tests');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setTestData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: type === 'checkbox' ? checked : value
        }
      }));
    } else {
      setTestData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
  };

  const handleSave = async () => {
    try {
      setIsLoading(true);
      
      if (isEditing) {
        await testService.updateTest(id, testData);
        dispatch(showToast({
          message: 'Test updated successfully',
          type: 'success'
        }));
      } else {
        const response = await testService.createTest(testData);
        dispatch(showToast({
          message: 'Test created successfully',
          type: 'success'
        }));
        navigate(`/tests/${response.data.id}/edit`);
      }
    } catch (error) {
      dispatch(showToast({
        message: error.response?.data?.message || 'Failed to save test',
        type: 'error'
      }));
    } finally {
      setIsLoading(false);
    }
  };

  const handlePublish = async () => {
    try {
      setIsLoading(true);
      await testService.publishTest(id);
      dispatch(showToast({
        message: 'Test published successfully',
        type: 'success'
      }));
      navigate('/tests');
    } catch (error) {
      dispatch(showToast({
        message: 'Failed to publish test',
        type: 'error'
      }));
    } finally {
      setIsLoading(false);
    }
  };

  const addQuestion = () => {
    const newQuestion = {
      id: Date.now(),
      type: 'multiple_choice',
      question: '',
      options: ['', '', '', ''],
      correctAnswer: '',
      points: 1,
      explanation: ''
    };
    
    setTestData(prev => ({
      ...prev,
      questions: [...prev.questions, newQuestion]
    }));
  };

  const updateQuestion = (questionId, field, value) => {
    setTestData(prev => ({
      ...prev,
      questions: prev.questions.map(q => 
        q.id === questionId ? { ...q, [field]: value } : q
      )
    }));
  };

  const deleteQuestion = (questionId) => {
    setTestData(prev => ({
      ...prev,
      questions: prev.questions.filter(q => q.id !== questionId)
    }));
  };

  const steps = [
    { id: 1, name: 'Basic Info', icon: FileText },
    { id: 2, name: 'Questions', icon: Plus },
    { id: 3, name: 'Settings', icon: Settings },
    { id: 4, name: 'Preview', icon: Eye }
  ];

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Test Title *
                </label>
                <input
                  type="text"
                  name="title"
                  value={testData.title}
                  onChange={handleInputChange}
                  className="input w-full"
                  placeholder="Enter test title"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Test Type *
                </label>
                <select
                  name="type"
                  value={testData.type}
                  onChange={handleInputChange}
                  className="input w-full"
                  required
                >
                  <option value="technical">Technical</option>
                  <option value="aptitude">Aptitude</option>
                  <option value="behavioral">Behavioral</option>
                  <option value="mixed">Mixed</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Duration (minutes) *
                </label>
                <input
                  type="number"
                  name="duration"
                  value={testData.duration}
                  onChange={handleInputChange}
                  className="input w-full"
                  min="5"
                  max="300"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Passing Score (%)
                </label>
                <input
                  type="number"
                  name="passingScore"
                  value={testData.passingScore}
                  onChange={handleInputChange}
                  className="input w-full"
                  min="0"
                  max="100"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                name="description"
                value={testData.description}
                onChange={handleInputChange}
                className="input w-full h-24"
                placeholder="Brief description of the test"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Instructions
              </label>
              <textarea
                name="instructions"
                value={testData.instructions}
                onChange={handleInputChange}
                className="input w-full h-32"
                placeholder="Instructions for test takers"
              />
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">Questions</h3>
              <div className="flex space-x-2">
                <button
                  onClick={() => setShowAIGenerator(true)}
                  className="btn btn-secondary btn-sm"
                >
                  <Brain className="h-4 w-4 mr-2" />
                  AI Generate
                </button>
                <button
                  onClick={addQuestion}
                  className="btn btn-primary btn-sm"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Question
                </button>
              </div>
            </div>

            {testData.questions.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-lg">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No questions yet</h3>
                <p className="text-gray-600 mb-4">Add questions manually or use AI to generate them</p>
                <div className="flex justify-center space-x-3">
                  <button
                    onClick={addQuestion}
                    className="btn btn-primary"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Question
                  </button>
                  <button
                    onClick={() => setShowAIGenerator(true)}
                    className="btn btn-secondary"
                  >
                    <Brain className="h-4 w-4 mr-2" />
                    Generate with AI
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {testData.questions.map((question, index) => (
                  <div key={question.id} className="bg-white border border-gray-200 rounded-lg p-6">
                    <div className="flex justify-between items-start mb-4">
                      <h4 className="text-lg font-medium text-gray-900">
                        Question {index + 1}
                      </h4>
                      <button
                        onClick={() => deleteQuestion(question.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Question Text *
                        </label>
                        <textarea
                          value={question.question}
                          onChange={(e) => updateQuestion(question.id, 'question', e.target.value)}
                          className="input w-full h-20"
                          placeholder="Enter your question"
                          required
                        />
                      </div>

                      {question.type === 'multiple_choice' && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Options
                          </label>
                          <div className="space-y-2">
                            {question.options.map((option, optionIndex) => (
                              <div key={optionIndex} className="flex items-center space-x-2">
                                <input
                                  type="radio"
                                  name={`correct-${question.id}`}
                                  checked={question.correctAnswer === String.fromCharCode(65 + optionIndex)}
                                  onChange={() => updateQuestion(question.id, 'correctAnswer', String.fromCharCode(65 + optionIndex))}
                                  className="text-primary-600"
                                />
                                <span className="text-sm font-medium text-gray-700 w-6">
                                  {String.fromCharCode(65 + optionIndex)}.
                                </span>
                                <input
                                  type="text"
                                  value={option}
                                  onChange={(e) => {
                                    const newOptions = [...question.options];
                                    newOptions[optionIndex] = e.target.value;
                                    updateQuestion(question.id, 'options', newOptions);
                                  }}
                                  className="input flex-1"
                                  placeholder={`Option ${String.fromCharCode(65 + optionIndex)}`}
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Points
                          </label>
                          <input
                            type="number"
                            value={question.points}
                            onChange={(e) => updateQuestion(question.id, 'points', parseInt(e.target.value))}
                            className="input w-full"
                            min="1"
                            max="100"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Difficulty
                          </label>
                          <select
                            value={question.difficulty || 'medium'}
                            onChange={(e) => updateQuestion(question.id, 'difficulty', e.target.value)}
                            className="input w-full"
                          >
                            <option value="easy">Easy</option>
                            <option value="medium">Medium</option>
                            <option value="hard">Hard</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Explanation (Optional)
                        </label>
                        <textarea
                          value={question.explanation}
                          onChange={(e) => updateQuestion(question.id, 'explanation', e.target.value)}
                          className="input w-full h-16"
                          placeholder="Explain why this answer is correct"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900">Test Settings</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h4 className="font-medium text-gray-900">Question Settings</h4>
                
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    name="settings.shuffleQuestions"
                    checked={testData.settings.shuffleQuestions}
                    onChange={handleInputChange}
                    className="rounded"
                  />
                  <span className="text-sm text-gray-700">Shuffle questions</span>
                </label>

                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    name="settings.shuffleOptions"
                    checked={testData.settings.shuffleOptions}
                    onChange={handleInputChange}
                    className="rounded"
                  />
                  <span className="text-sm text-gray-700">Shuffle answer options</span>
                </label>
              </div>

              <div className="space-y-4">
                <h4 className="font-medium text-gray-900">Result Settings</h4>
                
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    name="settings.showResults"
                    checked={testData.settings.showResults}
                    onChange={handleInputChange}
                    className="rounded"
                  />
                  <span className="text-sm text-gray-700">Show results immediately</span>
                </label>

                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    name="settings.allowReview"
                    checked={testData.settings.allowReview}
                    onChange={handleInputChange}
                    className="rounded"
                  />
                  <span className="text-sm text-gray-700">Allow answer review</span>
                </label>
              </div>

              <div className="space-y-4">
                <h4 className="font-medium text-gray-900">Security Settings</h4>
                
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    name="settings.preventCheating"
                    checked={testData.settings.preventCheating}
                    onChange={handleInputChange}
                    className="rounded"
                  />
                  <span className="text-sm text-gray-700">Enable anti-cheating measures</span>
                </label>

                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    name="settings.timeLimit"
                    checked={testData.settings.timeLimit}
                    onChange={handleInputChange}
                    className="rounded"
                  />
                  <span className="text-sm text-gray-700">Enforce time limit</span>
                </label>

                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    name="settings.autoSubmit"
                    checked={testData.settings.autoSubmit}
                    onChange={handleInputChange}
                    className="rounded"
                  />
                  <span className="text-sm text-gray-700">Auto-submit when time expires</span>
                </label>
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900">Test Preview</h3>
            
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">{testData.title}</h2>
                <p className="text-gray-600 mb-4">{testData.description}</p>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary-600">{testData.questions.length}</div>
                    <div className="text-sm text-gray-600">Questions</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary-600">{testData.duration}</div>
                    <div className="text-sm text-gray-600">Minutes</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary-600">{testData.passingScore}%</div>
                    <div className="text-sm text-gray-600">Pass Score</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary-600 capitalize">{testData.type}</div>
                    <div className="text-sm text-gray-600">Type</div>
                  </div>
                </div>

                {testData.instructions && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="font-medium text-blue-900 mb-2">Instructions:</h4>
                    <p className="text-blue-800 text-sm">{testData.instructions}</p>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <h4 className="font-medium text-gray-900">Sample Questions:</h4>
                {testData.questions.slice(0, 2).map((question, index) => (
                  <div key={question.id} className="border border-gray-200 rounded-lg p-4">
                    <h5 className="font-medium text-gray-900 mb-3">
                      {index + 1}. {question.question}
                    </h5>
                    {question.type === 'multiple_choice' && (
                      <div className="space-y-2">
                        {question.options.map((option, optionIndex) => (
                          <div key={optionIndex} className="flex items-center space-x-2">
                            <div className="w-4 h-4 border border-gray-300 rounded-full"></div>
                            <span className="text-sm text-gray-700">
                              {String.fromCharCode(65 + optionIndex)}. {option}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
                {testData.questions.length > 2 && (
                  <p className="text-sm text-gray-600 text-center">
                    ... and {testData.questions.length - 2} more questions
                  </p>
                )}
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          {isEditing ? 'Edit Test' : 'Create New Test'}
        </h1>
        <p className="text-gray-600 mt-2">
          {isEditing ? 'Update your test details and questions' : 'Build a comprehensive test with AI assistance'}
        </p>
      </div>

      {/* Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <button
                onClick={() => setCurrentStep(step.id)}
                className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                  currentStep === step.id
                    ? 'border-primary-600 bg-primary-600 text-white'
                    : currentStep > step.id
                    ? 'border-success-600 bg-success-600 text-white'
                    : 'border-gray-300 bg-white text-gray-400'
                }`}
              >
                <step.icon className="h-5 w-5" />
              </button>
              <span className={`ml-2 text-sm font-medium ${
                currentStep === step.id ? 'text-primary-600' : 'text-gray-500'
              }`}>
                {step.name}
              </span>
              {index < steps.length - 1 && (
                <div className={`w-16 h-0.5 mx-4 ${
                  currentStep > step.id ? 'bg-success-600' : 'bg-gray-300'
                }`} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="bg-white rounded-lg shadow-soft border border-gray-200 p-6 mb-8">
        {renderStepContent()}
      </div>

      {/* Actions */}
      <div className="flex justify-between">
        <div>
          {currentStep > 1 && (
            <button
              onClick={() => setCurrentStep(currentStep - 1)}
              className="btn btn-outline"
            >
              Previous
            </button>
          )}
        </div>
        
        <div className="flex space-x-3">
          <button
            onClick={handleSave}
            disabled={isLoading}
            className="btn btn-secondary"
          >
            <Save className="h-4 w-4 mr-2" />
            Save Draft
          </button>
          
          {currentStep < steps.length ? (
            <button
              onClick={() => setCurrentStep(currentStep + 1)}
              className="btn btn-primary"
            >
              Next
            </button>
          ) : (
            <button
              onClick={handlePublish}
              disabled={isLoading || testData.questions.length === 0}
              className="btn btn-success"
            >
              <Upload className="h-4 w-4 mr-2" />
              Publish Test
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default CreateTest;
