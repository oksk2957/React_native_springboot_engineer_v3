# JDK 8 기반의 OpenJDK 이미지를 사용합니다.
FROM openjdk:8-jdk-slim

# 작업 디렉토리를 설정합니다.
WORKDIR /app

# Gradle 빌드를 통해 생성된 JAR 파일을 컨테이너에 복사합니다.
COPY build/libs/*.jar app.jar

# Spring Boot 애플리케이션을 실행합니다.
ENTRYPOINT ["java","-jar","/app/app.jar"]

# 애플리케이션이 사용할 포트를 노출합니다.
EXPOSE 8088
