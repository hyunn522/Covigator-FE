import { useState, useEffect, useRef } from 'react';
import { HiUser } from 'react-icons/hi2';
import { useMutation } from 'react-query';
import { useNavigate } from 'react-router-dom';

import { signupUser } from '../../api/auth';
import Button from '../../components/common/button/Button';
import Input from '../../components/common/input';
import KakaoLogin from '../../components/login/KakaoLogin';
import { Topbar } from '../../layouts';
import { useAuthStore } from '../../stores/authStore';

import { z } from 'zod';

const signupSchema = z
  .object({
    image: z.string().optional(),
    email: z.string().email('유효한 이메일 주소를 입력해주세요'),
    phoneNumber: z
      .string()
      .regex(/^[0-9]{11}$/, '핸드폰 번호는 숫자 11자리여야 합니다'),
    nickname: z
      .string()
      .min(1, '닉네임은 필수입니다')
      .max(10, '닉네임은 10자 이하여야 합니다'),
    password: z
      .string()
      .regex(
        /^(?=.*[a-zA-Z가-힣])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&가-힣]{7,15}$/,
        '비밀번호는 한글/영문, 숫자, 특수문자를 포함하여 7~15자여야 합니다',
      ),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: '비밀번호가 일치하지 않습니다',
    path: ['confirmPassword'],
  });

type SignupFormData = z.infer<typeof signupSchema>;

type FormErrors = {
  [K in keyof SignupFormData]?: string;
} & {
  server?: string;
};

const Signup = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<SignupFormData>({
    email: '',
    phoneNumber: '',
    nickname: '',
    password: '',
    confirmPassword: '',
    image: undefined,
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isFormSubmitted, setIsFormSubmitted] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const setAuth = useAuthStore((state) => state.setAuth);

  const signupMutation = useMutation(signupUser, {
    onSuccess: (token) => {
      console.log('회원가입 성공');
      setAuth(token);

      // 상태 업데이트 후 네비게이션을 위해 setTimeout 사용
      setTimeout(() => navigate('/onboarding'), 0);
    },
    onError: () => {
      console.error('회원가입 실패');
      setErrors({ email: '회원가입에 실패했습니다. 다시 시도해 주세요.' });
    },
  });

  useEffect(() => {
    if (isFormSubmitted) {
      validateForm();
    }
  }, [formData, isFormSubmitted]);

  const validateForm = () => {
    console.log('폼 유효성 검사 시작');
    try {
      signupSchema.parse(formData);
      console.log('폼 유효성 검사 성공');
      setErrors({});
      return true;
    } catch (error) {
      console.log('폼 유효성 검사 실패');
      if (error instanceof z.ZodError) {
        const fieldErrors: FormErrors = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            fieldErrors[err.path[0] as keyof SignupFormData] = err.message;
          }
        });
        setErrors(fieldErrors);
      }
      return false;
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    field: keyof SignupFormData,
  ) => {
    setFormData({ ...formData, [field]: e.target.value });
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log('이미지 업로드 시작');
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        console.log('이미지 처리 완료');
        const base64String = reader.result as string;
        setPreviewImage(base64String);
        setFormData({ ...formData, image: base64String });
      };
      reader.onerror = () => {
        console.error('이미지 처리 실패');
        setErrors({ ...errors, image: '이미지 처리 중 오류가 발생했습니다.' });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    console.log('회원가입 제출 시작');
    e.preventDefault();
    setIsFormSubmitted(true);
    if (validateForm()) {
      try {
        const formDataToSend = new FormData();

        const postSignUpRequest = {
          image_url: formData.image ? formData.image.split(',')[1] : '',
          email: formData.email,
          phoneNumber: formData.phoneNumber,
          nickname: formData.nickname,
          password: formData.password,
        };

        console.log('서버 요청 시작');
        formDataToSend.append(
          'postSignUpRequest',
          new Blob([JSON.stringify(postSignUpRequest)], {
            type: 'application/json',
          }),
        );

        if (formData.image) {
          const byteCharacters = atob(formData.image.split(',')[1]);
          const byteNumbers = new Array(byteCharacters.length);
          for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
          }
          const byteArray = new Uint8Array(byteNumbers);
          const blob = new Blob([byteArray], { type: 'image/jpeg' });

          formDataToSend.append('image', blob, 'profile.jpg');
        }

        await signupMutation.mutateAsync(formDataToSend);
      } catch (error) {
        console.error('회원가입 처리 실패');
        if (error instanceof Error) {
          setErrors({ ...errors, server: error.message });
        } else {
          setErrors({
            ...errors,
            server: '회원가입 중 알 수 없는 오류가 발생했습니다.',
          });
        }
      }
    }
  };

  return (
    <div className="w-full h-full overflow-x-hidden">
      <div className="fixed top-0 left-0 right-0 z-50">
        <Topbar handleClick={() => navigate('/login')} />
      </div>

      <form
        onSubmit={handleSubmit}
        className="flex flex-col items-center mx-10 mt-[76px]"
      >
        {/* 프로필 이미지 섹션 */}
        <div className="flex justify-center mb-6">
          <div className="h-[100px] w-[100px] border border-bk-50 rounded-full flex items-center justify-center relative overflow-hidden">
            {previewImage ? (
              <img
                src={previewImage}
                alt="Profile"
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-bk-50">
                <HiUser className="h-20 w-20" />
              </span>
            )}
          </div>
        </div>

        {/* 프로필 사진 등록 버튼 */}
        <div className="mt-3 mb-[23px]">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImageChange}
            className="hidden"
            accept="image/*"
          />
          <Button
            size="xs"
            color="sub_300"
            shape="square"
            className="rounded-[5px] !px-[10px] !py-[4px]"
            onClick={() => fileInputRef.current?.click()}
          >
            프로필 사진 등록하기
          </Button>
        </div>

        {/* 입력 필드 섹션 */}
        <div className="flex flex-col items-center gap-y-3 w-full">
          <Input
            size="md"
            placeholder="닉네임을 입력해주세요"
            maxLength={10}
            onChange={(e) => handleInputChange(e, 'nickname')}
          />
          {errors.nickname && (
            <p className="text-red-500 text-sm">{errors.nickname}</p>
          )}

          <Input
            size="md"
            placeholder="휴대폰 번호를 입력해주세요"
            maxLength={11}
            type="text"
            onChange={(e) => {
              const value = e.target.value.replace(/[^0-9]/g, '');
              const syntheticEvent = {
                ...e,
                target: { ...e.target, value },
              };
              handleInputChange(syntheticEvent, 'phoneNumber');
            }}
          />

          <Input
            size="md"
            placeholder="이메일을 입력해주세요"
            onChange={(e) => handleInputChange(e, 'email')}
          />
          {errors.email && (
            <p className="text-red-500 text-sm">{errors.email}</p>
          )}

          <Input
            size="md"
            placeholder="비밀번호를 입력해주세요"
            type="password"
            maxLength={15}
            onChange={(e) => handleInputChange(e, 'password')}
          />

          {errors.password && (
            <p className="text-red-500 text-sm ">{errors.password}</p>
          )}

          <Input
            size="md"
            placeholder="비밀번호를 확인해주세요"
            type="password"
            maxLength={15}
            onChange={(e) => handleInputChange(e, 'confirmPassword')}
          />
          {errors.confirmPassword && (
            <p className="text-red-500 text-sm">{errors.confirmPassword}</p>
          )}

          <p className="text-sm text-bk-50">
            한글/영문, 숫자, 특수문자를 포함 7~15자
          </p>
        </div>

        {/* 서버 오류 메시지 */}
        {errors.server && (
          <p className="text-red-500 text-sm mt-3">{errors.server}</p>
        )}

        {/* 가입하기 버튼 */}
        <div className="mt-7">
          <Button
            size="lg"
            color="default"
            shape="square"
            disabled={signupMutation.isLoading}
            type="submit"
          >
            {signupMutation.isLoading ? '처리 중...' : '가입하기'}
          </Button>
        </div>

        {/* 구분선 */}
        <div className="flex w-full items-center max-w-[280px] mt-[21px] mb-4">
          <div className="flex-grow border-t border-bk-50 w-[95px]"></div>
          <span className="flex-shrink text-bk-50 mx-[7px] text-body4 whitespace-nowrap">
            간편 회원 가입
          </span>
          <div className="flex-grow border-t border-bk-50 w-[95px]"></div>
        </div>

        {/* 카카오 로그인 버튼 */}
        <div className="flex justify-center mb-28">
          <KakaoLogin />
        </div>
      </form>
    </div>
  );
};

export default Signup;
