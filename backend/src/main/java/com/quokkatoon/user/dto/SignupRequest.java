package com.quokkatoon.user.dto;

import com.quokkatoon.user.entity.Gender;
import jakarta.validation.constraints.*;

import java.time.LocalDate;

// 회원가입 4스텝에서 수집한 값을 마지막에 한 번에 제출
public record SignupRequest(
        @Email @NotBlank String email,
        @NotBlank @Size(min = 8, max = 64) String password,
        @NotBlank @Size(max = 30) String nickname,
        Gender gender,
        LocalDate birthDate
) {}
