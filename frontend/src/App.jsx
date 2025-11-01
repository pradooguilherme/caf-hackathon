import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import axios from 'axios';
import ChatWindow from './components/ChatWindow.jsx';
import ChoiceButtons from './components/ChoiceButtons.jsx';
import InputArea from './components/InputArea.jsx';
import ImageUploader from './components/ImageUploader.jsx';
import flowData from './data/flow.json';
import products from './data/products.json';
import logo from './assets/bia-logo.svg';
import './styles/theme.css';

const API_ENDPOINT = import.meta.env.VITE_API_URL || 'http://localhost:4000/api/ticket';
const PRODUCT_REGISTRATION_ENDPOINT =
  import.meta.env.VITE_REGISTRATION_API_URL || 'http://localhost:4000/api/registro-produto';
const PRODUCT_VERIFICATION_ENDPOINT =
  import.meta.env.VITE_PRODUCT_VERIFY_API_URL || 'http://localhost:4000/api/verificar-produto';
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const ACK_MESSAGES = {
  name: (value) => `Prazer em conhecê-lo(a), ${value}!`,
  email: () => 'Perfeito! Vou te mostrar as opções de produto.',
  issueDescription: () => 'Obrigada por compartilhar! Já estou finalizando seu atendimento.',
};

const REGISTRATION_ACK_MESSAGES = {
  registroNome: (value) => `Prazer em conhecê-lo(a), ${value}!`,
  registroEmail: () => 'Obrigado! Anotarei esse e-mail para o comprovante.',
  registroProduto: () => 'Produto registrado. Vamos seguir.',
  registroDataCompra: () => 'Data da compra anotada.',
  registroNotaFiscal: null,
};

const INITIAL_FORM = {
  acceptedPrivacy: null,
  name: '',
  email: '',
  productName: '',
  issueDescription: '',
  wantsImage: null,
  attachment: null,
};

const INITIAL_REGISTRATION = {
  nome: '',
  email: '',
  produto: '',
  dataCompra: '',
  notaFiscal: '',
};

const REGISTRATION_FIELD_MAP = {
  registroNome: 'nome',
  registroEmail: 'email',
  registroProduto: 'produto',
  registroDataCompra: 'dataCompra',
  registroNotaFiscal: 'notaFiscal',
};

function App() {
  const [messages, setMessages] = useState([]);
  const [waitingStep, setWaitingStep] = useState(null);
  const [choiceOptions, setChoiceOptions] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [isConversationClosed, setIsConversationClosed] = useState(false);
  const [isSendingTicket, setIsSendingTicket] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [conversationMode, setConversationMode] = useState(null);
  const [registrationData, setRegistrationData] = useState(INITIAL_REGISTRATION);
  const [isVerifyingProduct, setIsVerifyingProduct] = useState(false);

  const flowSequence = useMemo(() => flowData, []);
  const issueStepIndex = useMemo(
    () => flowSequence.findIndex((step) => step.key === 'issueDescription'),
    [flowSequence],
  );
  const formDataRef = useRef(formData);
  const messagesRef = useRef(messages);
  const registrationDataRef = useRef(registrationData);
  const verificationRef = useRef({ email: '', notaFiscal: '' });

  useEffect(() => {
    formDataRef.current = formData;
  }, [formData]);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    registrationDataRef.current = registrationData;
  }, [registrationData]);

  const buildMessage = useCallback((sender, text, extra = {}) => {
    const randomPart = Math.random().toString(16).slice(2);
    const { type, ...rest } = extra;
    const messageType = type ?? (rest.attachment ? 'attachment' : 'text');
    return {
      id: `${sender}-${Date.now()}-${randomPart}`,
      sender,
      text,
      type: messageType,
      ...rest,
    };
  }, []);

  const handleFlowError = useCallback(
    (error) => {
      console.error('Erro no fluxo:', error);
      setIsTyping(false);
      setWaitingStep(null);
      setChoiceOptions([]);
      const fallbackText = 'Desculpe, ocorreu um erro. Vamos tentar novamente.';
      setMessages((prev) => {
        const lastMessage = prev[prev.length - 1];
        if (lastMessage && lastMessage.sender === 'bot' && lastMessage.metaKey === 'flow-error') {
          return prev;
        }
        const next = [...prev, buildMessage('bot', fallbackText, { metaKey: 'flow-error' })];
        messagesRef.current = next;
        return next;
      });
    },
    [buildMessage],
  );

  const showBotMessage = useCallback(
    (text, extra = {}) =>
      new Promise((resolve) => {
        const { delay = 700, messageKey, ...messageExtra } = extra;
        setIsTyping(true);
        setTimeout(() => {
          try {
            setMessages((prev) => {
              if (messageKey) {
                const lastMessage = prev[prev.length - 1];
                if (lastMessage && lastMessage.sender === 'bot' && lastMessage.metaKey === messageKey) {
                  return prev;
                }
              }
              const messagePayload = messageKey ? { ...messageExtra, metaKey: messageKey } : messageExtra;
              const next = [...prev, buildMessage('bot', text, messagePayload)];
              messagesRef.current = next;
              return next;
            });
            setIsTyping(false);
            resolve();
          } catch (error) {
            handleFlowError(error);
            setIsTyping(false);
            resolve();
          }
        }, delay);
      }),
    [buildMessage, handleFlowError],
  );

  const advanceToStep = useCallback(
    async function next(index, modeOverride) {
      try {
        if (isConversationClosed || index >= flowSequence.length) {
          setWaitingStep(null);
          setChoiceOptions([]);
          return;
        }

        const step = flowSequence[index];
        if (!step) {
          return;
        }

        const activeMode = modeOverride ?? conversationMode;
        if (step.mode && step.mode !== activeMode) {
          await next(index + 1, activeMode);
          return;
        }

        setWaitingStep(null);
        setChoiceOptions([]);
        setUploadError('');

        if (step.type === 'verification') {
          verificationRef.current = { email: '', notaFiscal: '' };
          await showBotMessage(step.message, { messageKey: `step-${step.id}` });
          setWaitingStep({ step, index, stage: 'email' });
          setInputValue('');
          return;
        }

        if (step.type === 'text') {
          await showBotMessage(step.message, { messageKey: `step-${step.id}` });
          if (step.endConversation) {
            setIsConversationClosed(true);
            setWaitingStep(null);
            setChoiceOptions([]);
            return;
          }
          await next(index + 1, activeMode);
          return;
        }

        if (step.type === 'choice') {
          await showBotMessage(step.message, { messageKey: `step-${step.id}` });
          setWaitingStep({ step, index });
          setChoiceOptions(step.options);
          return;
        }

        if (step.type === 'catalog') {
          const productList = products
            .map((productName, itemIndex) => `${itemIndex + 1} - ${productName}`)
            .join('\n');
          const body = `${step.message}\n${productList}`;
          await showBotMessage(body, { messageKey: `step-${step.id}` });
          setWaitingStep({ step, index });
          setChoiceOptions([]);
          setInputValue('');
          return;
        }

        if (step.type === 'input') {
          const messageText =
            step.key === 'issueDescription' && formDataRef.current.productName
              ? `Entendido! Qual é o problema com o produto ${formDataRef.current.productName}?`
              : step.message;
          await showBotMessage(messageText, { messageKey: `step-${step.id}` });
          setWaitingStep({ step, index });
          setInputValue('');
          return;
        }

        if (step.type === 'upload') {
          await showBotMessage(step.message, { messageKey: `step-${step.id}` });
          setWaitingStep({ step, index });
          return;
        }

        throw new Error(`Tipo de etapa desconhecido: ${step.type}`);
      } catch (error) {
        handleFlowError(error);
      }
    },
    [conversationMode, flowSequence, handleFlowError, isConversationClosed, showBotMessage],
  );

  useEffect(() => {
    if (messagesRef.current.length === 0) {
      advanceToStep(0);
    }
  }, [advanceToStep]);

  const processTicketSubmission = useCallback(async () => {
    if (conversationMode !== 'garantia' || isSendingTicket || isConversationClosed) {
      return;
    }

    setIsSendingTicket(true);
    try {
      const snapshot = formDataRef.current;
      const hasImage = Boolean(snapshot.attachment?.file);

      const loadingMessage = hasImage
        ? 'Enviando imagem e registrando seu ticket...'
        : 'Registrando seu ticket. Um instante, por favor...';

      await showBotMessage(loadingMessage, { delay: 900 });

      const formPayload = new FormData();
      formPayload.append('name', snapshot.name);
      formPayload.append('email', snapshot.email);
      formPayload.append('productName', snapshot.productName);
      formPayload.append('issueDescription', snapshot.issueDescription);
      if (snapshot.wantsImage != null) {
        formPayload.append('wantsImage', String(snapshot.wantsImage));
      }
      if (snapshot.attachment?.file) {
        formPayload.append('attachment', snapshot.attachment.file);
      }

      const response = await axios.post(API_ENDPOINT, formPayload, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const ticketId = response.data?.ticketId ?? 'TCK-0001';
      await showBotMessage(`✅ Tudo certo! Seu ticket foi aberto com sucesso. Em breve entraremos em contato.\n\nNúmero do ticket: ${ticketId}`);
      setIsConversationClosed(true);
    } catch (error) {
      console.error('Erro ao enviar ticket:', error);
      await showBotMessage('Ops! Não consegui registrar o ticket agora. Deseja tentar novamente?');
      setChoiceOptions(['Tentar novamente', 'Cancelar']);
      setWaitingStep({
        step: {
          id: 'retry_confirm',
          type: 'confirm',
        },
        index: flowSequence.length,
      });
    } finally {
      setIsSendingTicket(false);
    }
  }, [conversationMode, flowSequence.length, formDataRef, isConversationClosed, isSendingTicket, showBotMessage]);

  const processProductRegistration = useCallback(async () => {
    if (conversationMode !== 'registro' || isSendingTicket || isConversationClosed) {
      return false;
    }

    setIsSendingTicket(true);
    try {
      await showBotMessage('Registrando seu produto. Um instante, por favor...', { delay: 700 });

      const snapshot = registrationDataRef.current;
      const payload = {
        nome: snapshot.nome,
        email: snapshot.email,
        produto: snapshot.produto,
        dataCompra: snapshot.dataCompra,
        notaFiscal: snapshot.notaFiscal,
      };

      await axios.post(PRODUCT_REGISTRATION_ENDPOINT, payload, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const freshRegistration = { ...INITIAL_REGISTRATION };
      setRegistrationData(freshRegistration);
      registrationDataRef.current = freshRegistration;

      return true;
    } catch (error) {
      console.error('Erro ao registrar produto:', error);
      await showBotMessage('Ops! Não consegui registrar o produto agora. Por favor, tente novamente mais tarde.');
      setIsConversationClosed(true);
      setChoiceOptions([]);
      setWaitingStep(null);
      return false;
    } finally {
      setIsSendingTicket(false);
    }
  }, [conversationMode, isConversationClosed, isSendingTicket, showBotMessage]);

  const verificarProduto = useCallback(async (email, notaFiscal) => {
    try {
      const response = await axios.post(PRODUCT_VERIFICATION_ENDPOINT, {
        email,
        notaFiscal,
      });
      return response.data;
    } catch (error) {
      console.error('Erro ao verificar produto registrado:', error);
      return { found: false, error: true };
    }
  }, []);

  const handleChoiceSelect = useCallback(
    async (option) => {
      if (!waitingStep || isConversationClosed || isSendingTicket) {
        return;
      }

      const { step, index } = waitingStep;

      try {
        setMessages((prev) => {
          const next = [...prev, buildMessage('user', option)];
          messagesRef.current = next;
          return next;
        });
        setChoiceOptions([]);
        setWaitingStep(null);

        if (step.id === 1) {
          let nextMode = null;
          if (option === 'Acionar garantia') {
            nextMode = 'garantia';
            const freshForm = { ...INITIAL_FORM };
            setFormData(freshForm);
            formDataRef.current = freshForm;
            const freshRegistration = { ...INITIAL_REGISTRATION };
            setRegistrationData(freshRegistration);
            registrationDataRef.current = freshRegistration;
          } else if (option === 'Registrar produto comprado') {
            nextMode = 'registro';
            const freshRegistration = { ...INITIAL_REGISTRATION };
            setRegistrationData(freshRegistration);
            registrationDataRef.current = freshRegistration;
            const freshForm = { ...INITIAL_FORM };
            setFormData(freshForm);
            formDataRef.current = freshForm;
          } else {
            nextMode = 'contato';
          }

          setConversationMode(nextMode);
          setInputValue('');
          setUploadError('');
          setIsVerifyingProduct(false);
          verificationRef.current = { email: '', notaFiscal: '' };

          if (nextMode === 'garantia') {
            await advanceToStep(index + 1, nextMode);
          } else if (nextMode === 'registro') {
            await advanceToStep(index + 1, nextMode);
          } else if (nextMode === 'contato') {
            await advanceToStep(index + 1, nextMode);
          }
          return;
        }

        if (step.id === 'retry_confirm') {
          if (option === 'Tentar novamente') {
            setChoiceOptions([]);
            setWaitingStep(null);
            await processTicketSubmission();
            return;
          }
          await showBotMessage('Certo! Se precisar de ajuda novamente, é só me chamar.');
          setIsConversationClosed(true);
          return;
        }

        if (step.type === 'choice') {
          if (step.id === 3 && conversationMode === 'garantia') {
            if (option === 'Sim') {
              setFormData((prev) => ({ ...prev, acceptedPrivacy: true }));
              await showBotMessage('Obrigada! Vamos avançar com a abertura do ticket.');
              await advanceToStep(index + 1, conversationMode);
            } else {
              setFormData((prev) => ({ ...prev, acceptedPrivacy: false }));
              await showBotMessage('Tudo bem! Caso mude de ideia, estarei aqui para continuar o atendimento.');
              setIsConversationClosed(true);
            }
          } else if (step.id === 9 && conversationMode === 'garantia') {
            if (option === 'Sim') {
              setFormData((prev) => ({ ...prev, wantsImage: true }));
              await showBotMessage('Perfeito! Assim que anexar a imagem seguimos para o encerramento.');
              await advanceToStep(index + 1, conversationMode);
            } else {
              setFormData((prev) => ({
                ...prev,
                wantsImage: false,
                attachment: null,
              }));
              formDataRef.current = {
                ...formDataRef.current,
                wantsImage: false,
                attachment: null,
              };
              await showBotMessage('Sem problemas! Vou finalizar seu atendimento.');
              await processTicketSubmission();
            }
          } else if (step.options.includes(option)) {
            await advanceToStep(index + 1, conversationMode);
          }
          return;
        }
      } catch (error) {
        handleFlowError(error);
      }
    },
    [
      advanceToStep,
      buildMessage,
      conversationMode,
      handleFlowError,
      isConversationClosed,
      isSendingTicket,
      processTicketSubmission,
      showBotMessage,
      waitingStep,
    ],
  );

  const handleInputSubmit = useCallback(async () => {
    if (!waitingStep || isConversationClosed) {
      return;
    }

    try {
      const value = inputValue.trim();
      if (!value) {
        return;
      }

      const { step, index } = waitingStep;

      if (step.type === 'verification') {
        const currentStage = waitingStep.stage || 'email';

        if (currentStage === 'email') {
          if (!EMAIL_REGEX.test(value)) {
            await showBotMessage('Esse e-mail não parece válido. Pode me enviar novamente?');
            return;
          }

          verificationRef.current = {
            email: value.trim(),
            notaFiscal: '',
          };
          setInputValue('');
          setWaitingStep({ ...waitingStep, stage: 'nota' });
          await showBotMessage('Perfeito! Agora me informe o número da nota fiscal.', {
            messageKey: `verification-note-${step.id}`,
          });
          return;
        }

        const notaFiscal = value.trim();
        if (!notaFiscal) {
          await showBotMessage('Por favor, informe o número da nota fiscal para continuarmos.');
          return;
        }

        const verificationIndex = index;
        verificationRef.current = {
          ...verificationRef.current,
          notaFiscal,
        };
        setInputValue('');
        setWaitingStep(null);
        setIsVerifyingProduct(true);

        const lookupResult = await verificarProduto(verificationRef.current.email, notaFiscal);

        setIsVerifyingProduct(false);

        if (lookupResult?.error) {
          await showBotMessage('Não consegui verificar no momento. Vamos seguir com o atendimento normalmente.', {
            type: 'status-error',
          });
          await advanceToStep(verificationIndex + 1, conversationMode);
          return;
        }

        if (lookupResult?.found) {
          const verifiedProduct = lookupResult.produto?.trim() ?? '';
          const verifiedName = lookupResult.nome?.trim() ?? '';
          const verifiedEmail = verificationRef.current.email;

          setFormData((prev) => {
            const updated = {
              ...prev,
              name: verifiedName || prev.name,
              email: verifiedEmail,
              productName: verifiedProduct || prev.productName,
              acceptedPrivacy: true,
            };
            formDataRef.current = updated;
            return updated;
          });

          await showBotMessage('Localizei seu produto registrado! Vamos agilizar o processo de garantia.', {
            type: 'status-success',
          });
          if (verifiedProduct) {
            await showBotMessage(`Produto encontrado: ${verifiedProduct}. Vamos prosseguir com o acionamento da garantia.`, {
              type: 'status-success',
            });
          }

          const targetIndex = issueStepIndex > -1 ? issueStepIndex : verificationIndex + 1;
          await advanceToStep(targetIndex, conversationMode);
          return;
        }

        await showBotMessage('Não localizei nenhum produto registrado com esses dados. Vamos coletar suas informações normalmente.', {
          type: 'status-error',
        });
        await advanceToStep(verificationIndex + 1, conversationMode);
        return;
      }

      if (step.type === 'catalog') {
        setMessages((prev) => {
          const next = [...prev, buildMessage('user', value)];
          messagesRef.current = next;
          return next;
        });

        const choice = Number.parseInt(value, 10);
        const totalProducts = products.length;
        if (Number.isNaN(choice) || choice < 1 || choice > totalProducts) {
          await showBotMessage(`Ops! Digite um número entre 1 e ${totalProducts} para selecionar um produto.`);
          const productList = products
            .map((productName, itemIndex) => `${itemIndex + 1} - ${productName}`)
            .join('\n');
          await showBotMessage(`${step.message}\n${productList}`);
          setInputValue('');
          return;
        }

        const productName = products[choice - 1];
        setFormData((prev) => {
          const updated = { ...prev, [step.key ?? 'productName']: productName };
          formDataRef.current = updated;
          return updated;
        });
        setInputValue('');
        setWaitingStep(null);
        await showBotMessage(`Produto selecionado: ${productName}.`, { messageKey: `catalog-selection-${step.id}` });
        await advanceToStep(index + 1, conversationMode);
        return;
      }

      if ((step.key === 'email' || step.key === 'registroEmail') && !EMAIL_REGEX.test(value)) {
        await showBotMessage('Hmm, esse e-mail não parece válido. Pode conferir e me enviar novamente?');
        return;
      }

      setMessages((prev) => {
        const next = [...prev, buildMessage('user', value)];
        messagesRef.current = next;
        return next;
      });

      const isRegistrationStep = step.mode === 'registro';

      if (isRegistrationStep) {
        const registrationKey = REGISTRATION_FIELD_MAP[step.key];
        if (registrationKey) {
          setRegistrationData((prev) => {
            const updated = { ...prev, [registrationKey]: value };
            registrationDataRef.current = updated;
            return updated;
          });
        }
      } else {
        setFormData((prev) => {
          const updated = { ...prev, [step.key]: value };
          return updated;
        });
        formDataRef.current = {
          ...formDataRef.current,
          [step.key]: value,
        };
      }

      setInputValue('');
      setWaitingStep(null);

      const ackTemplate = isRegistrationStep ? REGISTRATION_ACK_MESSAGES[step.key] : ACK_MESSAGES[step.key];
      const ackMessage = typeof ackTemplate === 'function' ? ackTemplate(value) : ackTemplate;
      if (ackMessage) {
        await showBotMessage(ackMessage);
      }

      if (isRegistrationStep && step.key === 'registroNotaFiscal') {
        const success = await processProductRegistration();
        if (success) {
          await advanceToStep(index + 1, conversationMode);
        }
        return;
      }

      if (isRegistrationStep) {
        await advanceToStep(index + 1, conversationMode);
        return;
      }

      await advanceToStep(index + 1, conversationMode);
    } catch (error) {
      handleFlowError(error);
    }
  }, [
    advanceToStep,
    buildMessage,
    conversationMode,
    handleFlowError,
    inputValue,
    isConversationClosed,
    processProductRegistration,
    showBotMessage,
    issueStepIndex,
    verificarProduto,
    waitingStep,
  ]);

  const handleFileSelection = useCallback(
    (event) => {
      if (!waitingStep || waitingStep.step.type !== 'upload') {
        return;
      }

      try {
        const file = event.target.files?.[0];
        if (!file) {
          return;
        }

        const canUseFile = file.type.startsWith('image/');
        const underLimit = file.size <= 5 * 1024 * 1024;

        if (!canUseFile) {
          setUploadError('Por favor, selecione um arquivo de imagem (JPEG, PNG, etc.).');
          return;
        }

        if (!underLimit) {
          setUploadError('Essa imagem é um pouco grande. Tente um arquivo de até 5 MB.');
          return;
        }

        setUploadError('');
        event.target.value = '';

        const reader = new FileReader();
        reader.onloadend = async () => {
          try {
            const preview = reader.result;

            setFormData((prev) => {
              const updated = {
                ...prev,
                attachment: {
                  file,
                  type: 'image',
                  name: file.name,
                  preview,
                },
              };
              formDataRef.current = updated;
              return updated;
            });

            setMessages((prev) => {
              const next = [
                ...prev,
                buildMessage('user', 'Imagem anexada.', {
                  attachment: {
                    type: 'image',
                    name: file.name,
                    preview,
                  },
                  type: 'attachment',
                }),
              ];
              messagesRef.current = next;
              return next;
            });

            setWaitingStep(null);
            await showBotMessage('Imagem recebida! Vou finalizar seu ticket agora.');
            await processTicketSubmission();
          } catch (error) {
            handleFlowError(error);
          }
        };

        reader.onerror = () => {
          handleFlowError(new Error('Falha ao ler o arquivo selecionado.'));
        };

        reader.readAsDataURL(file);
      } catch (error) {
        handleFlowError(error);
      }
    },
    [buildMessage, handleFlowError, processTicketSubmission, showBotMessage, waitingStep],
  );

  const handleSkipUpload = useCallback(async () => {
    if (!waitingStep || waitingStep.step.type !== 'upload') {
      return;
    }

    try {
      setWaitingStep(null);
      setUploadError('');
      setFormData((prev) => {
        const updated = { ...prev, attachment: null, wantsImage: false };
        formDataRef.current = updated;
        return updated;
      });
      setMessages((prev) => {
        const next = [...prev, buildMessage('user', 'Prefiro seguir sem anexar imagem.')];
        messagesRef.current = next;
        return next;
      });
      await showBotMessage('Tudo bem, vamos continuar sem a imagem.');
      await processTicketSubmission();
    } catch (error) {
      handleFlowError(error);
    }
  }, [buildMessage, handleFlowError, processTicketSubmission, showBotMessage, waitingStep]);

  const currentStepType = waitingStep?.step.type;
  const currentVerificationStage = waitingStep?.stage || 'email';

  const isInputDisabled =
    isConversationClosed ||
    isSendingTicket ||
    isVerifyingProduct ||
    !waitingStep ||
    (currentStepType !== 'input' && currentStepType !== 'catalog' && currentStepType !== 'verification');

  const placeholderText = isConversationClosed
    ? 'Atendimento finalizado.'
    : currentStepType === 'input'
      ? 'Digite sua resposta e pressione Enter'
      : currentStepType === 'catalog'
        ? 'Digite o número do produto escolhido e pressione Enter'
        : currentStepType === 'verification'
          ? currentVerificationStage === 'email'
            ? 'Digite o e-mail utilizado no registro'
            : 'Informe o número da nota fiscal registrada'
          : 'Aguarde a próxima etapa...';

  return (
    <div className="min-h-screen w-full bg-transparent px-4 py-8 sm:px-6">
      <div className="mx-auto flex max-w-4xl flex-col gap-6 sm:gap-10">
        <header className="bia-header flex items-center justify-between rounded-3xl px-6 py-5 text-white shadow-bia-bot backdrop-blur">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15">
              <img src={logo} alt="Logotipo Assistente Bia" className="h-8 w-8" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium uppercase tracking-wide text-white/80">Atendimento CAF Máquinas</p>
              <h1 className="text-2xl font-semibold text-white">Assistente Virtual Bia</h1>
              <p className="text-xs text-white/80">Suporte dedicado para abertura de tickets de garantia</p>
            </div>
          </div>
          <div className="hidden flex-col items-end text-right text-xs text-white/75 sm:flex">
            <span>Horário de atendimento</span>
            <span className="font-medium text-white">Seg a Sex — 08h às 18h</span>
          </div>
        </header>

        <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col overflow-hidden rounded-[34px] border border-red-100 bg-white/95 shadow-bia-user backdrop-blur">
          <ChatWindow messages={messages} isTyping={isTyping} />

          {waitingStep?.step.type === 'upload' && !isConversationClosed && (
            <ImageUploader
              onFileSelect={handleFileSelection}
              onSkip={handleSkipUpload}
              disabled={isSendingTicket || isVerifyingProduct}
              error={uploadError}
            />
          )}

          <ChoiceButtons options={choiceOptions} onSelect={handleChoiceSelect} disabled={isConversationClosed || isSendingTicket} />

          <InputArea
            value={inputValue}
            onChange={setInputValue}
            onSubmit={handleInputSubmit}
            disabled={isInputDisabled}
            placeholder={placeholderText}
          />
        </main>
      </div>
    </div>
  );
}

export default App;
