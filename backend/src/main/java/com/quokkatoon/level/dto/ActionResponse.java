package com.quokkatoon.level.dto;

public record ActionResponse<T>(T result, ExpChangeResponse exp) {}
